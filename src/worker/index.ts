export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

const DEFAULT_ADMIN_PASS = "admin1234";

// Helper for CORS & JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return corsOptions();
    }

    try {
      // 1. GET /api/dimensions - Returns stores, brands, answer_choices
      if (method === "GET" && path === "/api/dimensions") {
        const stores = await env.DB.prepare(
          "SELECT id, region, mall, province, store_name FROM stores ORDER BY region, mall, store_name"
        ).all();

        const brands = await env.DB.prepare(
          "SELECT id, name FROM brands ORDER BY id"
        ).all();

        const answers = await env.DB.prepare(
          "SELECT id, name FROM answer_choices ORDER BY id"
        ).all();

        return jsonResponse({
          stores: stores.results || [],
          brands: brands.results || [],
          answerChoices: answers.results || [],
        });
      }

      // 2. GET /api/stores - Returns all store dimensions
      if (method === "GET" && path === "/api/stores") {
        const { results } = await env.DB.prepare(
          "SELECT id, region, mall, province, store_name FROM stores ORDER BY region, mall, store_name"
        ).all();
        return jsonResponse({ stores: results || [] });
      }

      // 3. GET /api/survey/:storeId - Load survey data for store
      if (method === "GET" && path.startsWith("/api/survey/")) {
        const storeIdStr = path.replace("/api/survey/", "");
        const storeId = parseInt(storeIdStr, 10);
        if (isNaN(storeId)) {
          return jsonResponse({ error: "Invalid store ID" }, 400);
        }

        const header: any = await env.DB.prepare(
          "SELECT id, store_id, last_update, user FROM survey_header WHERE store_id = ?"
        ).bind(storeId).first();

        if (!header) {
          return jsonResponse({ exists: false, details: [] });
        }

        const { results } = await env.DB.prepare(
          "SELECT brand_id, answer_choice_id, value FROM survey_detail WHERE survey_id = ?"
        ).bind(header.id).all();

        return jsonResponse({
          exists: true,
          header,
          details: results || [],
        });
      }

      // 4. POST /api/survey - Create or Update Survey
      if (method === "POST" && path === "/api/survey") {
        const body: any = await request.json();
        const { storeId, user, details } = body;

        if (!storeId || !Array.isArray(details)) {
          return jsonResponse({ error: "Missing storeId or details array" }, 400);
        }

        const userName = user && user.trim() ? user.trim() : "user";
        const now = new Date().toISOString();

        // Check existing header
        let header: any = await env.DB.prepare(
          "SELECT id FROM survey_header WHERE store_id = ?"
        ).bind(storeId).first();

        let surveyId: number;

        if (header) {
          surveyId = header.id;
          await env.DB.prepare(
            "UPDATE survey_header SET last_update = ?, user = ? WHERE id = ?"
          ).bind(now, userName, surveyId).run();
        } else {
          const res = await env.DB.prepare(
            "INSERT INTO survey_header (store_id, last_update, user) VALUES (?, ?, ?)"
          ).bind(storeId, now, userName).run();
          surveyId = res.meta.last_row_id;
        }

        // Overwrite existing details for this survey
        await env.DB.prepare(
          "DELETE FROM survey_detail WHERE survey_id = ?"
        ).bind(surveyId).run();

        // Batch insert details
        const statements = [];
        for (const item of details) {
          const brandId = parseInt(item.brandId, 10);
          const choiceId = parseInt(item.answerChoiceId, 10);
          const val = parseInt(item.value, 10);

          if (!isNaN(brandId) && !isNaN(choiceId) && !isNaN(val)) {
            statements.push(
              env.DB.prepare(
                "INSERT INTO survey_detail (survey_id, brand_id, answer_choice_id, value) VALUES (?, ?, ?, ?)"
              ).bind(surveyId, brandId, choiceId, val)
            );
          }
        }

        if (statements.length > 0) {
          await env.DB.batch(statements);
        }

        return jsonResponse({ success: true, surveyId, message: "Survey saved successfully" });
      }

      // 5. POST /api/admin/login
      if (method === "POST" && path === "/api/admin/login") {
        const body: any = await request.json();
        const adminPass = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;
        if (body.password === adminPass) {
          return jsonResponse({ success: true, token: "admin-authenticated-token" });
        } else {
          return jsonResponse({ success: false, error: "Incorrect password" }, 401);
        }
      }

      // 6. POST /api/admin/import/stores
      if (method === "POST" && path === "/api/admin/import/stores") {
        const csvText = await request.text();
        const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          return jsonResponse({ error: "CSV file is empty or missing data" }, 400);
        }

        // Header format: Name, Mall, Province, Region
        const batch: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length >= 4) {
            const [storeName, mall, province, region] = cols;
            batch.push(
              env.DB.prepare(
                "INSERT INTO stores (region, mall, province, store_name) VALUES (?, ?, ?, ?)"
              ).bind(region, mall, province, storeName)
            );
          }
        }

        if (batch.length > 0) {
          // Execute in batches of 50 to avoid D1 query limits
          for (let i = 0; i < batch.length; i += 50) {
            await env.DB.batch(batch.slice(i, i + 50));
          }
        }

        return jsonResponse({ success: true, imported: batch.length });
      }

      // 7. POST /api/admin/import/brands
      if (method === "POST" && path === "/api/admin/import/brands") {
        const csvText = await request.text();
        const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        let imported = 0;

        const batch: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim().replace(/^"|"$/g, '');
          if (line && line.toLowerCase() !== "brand") {
            batch.push(
              env.DB.prepare(
                "INSERT OR IGNORE INTO brands (name) VALUES (?)"
              ).bind(line)
            );
          }
        }

        if (batch.length > 0) {
          await env.DB.batch(batch);
          imported = batch.length;
        }

        return jsonResponse({ success: true, imported });
      }

      // 8. POST /api/admin/import/answers
      if (method === "POST" && path === "/api/admin/import/answers") {
        const csvText = await request.text();
        const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        let imported = 0;

        const batch: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim().replace(/^"|"$/g, '');
          if (line && line.toLowerCase() !== "answer choice") {
            batch.push(
              env.DB.prepare(
                "INSERT OR IGNORE INTO answer_choices (name) VALUES (?)"
              ).bind(line)
            );
          }
        }

        if (batch.length > 0) {
          await env.DB.batch(batch);
          imported = batch.length;
        }

        return jsonResponse({ success: true, imported });
      }

      // 9. POST /api/admin/reset-dimensions
      if (method === "POST" && path === "/api/admin/reset-dimensions") {
        await env.DB.batch([
          env.DB.prepare("DELETE FROM survey_detail"),
          env.DB.prepare("DELETE FROM survey_header"),
          env.DB.prepare("DELETE FROM stores"),
          env.DB.prepare("DELETE FROM brands"),
          env.DB.prepare("DELETE FROM answer_choices"),
        ]);
        return jsonResponse({ success: true, message: "All dimensions and surveys reset" });
      }

      // 10. GET /api/admin/surveys - Browse surveys with filters
      if (method === "GET" && path === "/api/admin/surveys") {
        const regionFilter = url.searchParams.get("region");
        const storeFilter = url.searchParams.get("storeId");
        const brandFilter = url.searchParams.get("brandId");

        let query = `
          SELECT 
            sh.id as survey_id,
            s.id as store_id,
            s.region,
            s.mall,
            s.province,
            s.store_name,
            sh.last_update,
            sh.user,
            b.id as brand_id,
            b.name as brand_name,
            ac.id as answer_choice_id,
            ac.name as answer_choice_name,
            sd.value
          FROM survey_header sh
          JOIN stores s ON sh.store_id = s.id
          LEFT JOIN survey_detail sd ON sh.id = sd.survey_id
          LEFT JOIN brands b ON sd.brand_id = b.id
          LEFT JOIN answer_choices ac ON sd.answer_choice_id = ac.id
          WHERE 1=1
        `;

        const params: any[] = [];
        if (regionFilter) {
          query += " AND s.region = ?";
          params.push(regionFilter);
        }
        if (storeFilter) {
          query += " AND s.id = ?";
          params.push(parseInt(storeFilter, 10));
        }
        if (brandFilter) {
          query += " AND b.id = ?";
          params.push(parseInt(brandFilter, 10));
        }

        query += " ORDER BY s.region, s.mall, s.store_name, b.id, ac.id";

        const stmt = env.DB.prepare(query);
        const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

        return jsonResponse({ results: results || [] });
      }

      // 11. GET /api/admin/export - CSV Export
      if (method === "GET" && path === "/api/admin/export") {
        const query = `
          SELECT 
            s.region,
            s.mall,
            s.province,
            s.store_name,
            sh.last_update,
            sh.user,
            b.name as brand_name,
            ac.name as answer_choice_name,
            sd.value
          FROM survey_header sh
          JOIN stores s ON sh.store_id = s.id
          JOIN survey_detail sd ON sh.id = sd.survey_id
          JOIN brands b ON sd.brand_id = b.id
          JOIN answer_choices ac ON sd.answer_choice_id = ac.id
          ORDER BY s.region, s.mall, s.store_name, b.id, ac.id
        `;

        const { results } = await env.DB.prepare(query).all();

        let csv = "\uFEFFภูมิภาค,ห้าง,จังหวัด,ชื่อสาขา,วันที่อัปเดต,ผู้กรอก,แบรนด์,คำตอบ,จำนวน\n";
        if (results) {
          for (const r of results as any[]) {
            const line = [
              `"${r.region || ''}"`,
              `"${r.mall || ''}"`,
              `"${r.province || ''}"`,
              `"${r.store_name || ''}"`,
              `"${r.last_update || ''}"`,
              `"${r.user || ''}"`,
              `"${r.brand_name || ''}"`,
              `"${r.answer_choice_name || ''}"`,
              r.value ?? 0
            ].join(",");
            csv += line + "\n";
          }
        }

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=survey_results.csv",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // 12. DELETE /api/admin/survey/:surveyId
      if (method === "DELETE" && path.startsWith("/api/admin/survey/")) {
        const surveyIdStr = path.replace("/api/admin/survey/", "");
        const surveyId = parseInt(surveyIdStr, 10);
        if (isNaN(surveyId)) {
          return jsonResponse({ error: "Invalid survey ID" }, 400);
        }

        await env.DB.prepare("DELETE FROM survey_detail WHERE survey_id = ?").bind(surveyId).run();
        await env.DB.prepare("DELETE FROM survey_header WHERE id = ?").bind(surveyId).run();

        return jsonResponse({ success: true, message: "Survey deleted successfully" });
      }

      // 13. DELETE /api/admin/clear - Clear all survey data
      if (method === "DELETE" && path === "/api/admin/clear") {
        await env.DB.batch([
          env.DB.prepare("DELETE FROM survey_detail"),
          env.DB.prepare("DELETE FROM survey_header"),
        ]);
        return jsonResponse({ success: true, message: "All survey responses cleared" });
      }

      return jsonResponse({ error: "Not Found" }, 404);
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
    }
  },
};
