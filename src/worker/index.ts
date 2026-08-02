export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

const DEFAULT_ADMIN_PASS = "admin1234";

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
        const includeInactive = url.searchParams.get("includeInactive") === "true";
        const whereClause = includeInactive ? "" : "WHERE is_active = 1";

        const stores = await env.DB.prepare(
          `SELECT id, region, mall, province, store_name, is_active FROM stores ${whereClause} ORDER BY mall, region, store_name`
        ).all();

        const brands = await env.DB.prepare(
          `SELECT id, name, is_active FROM brands ${whereClause} ORDER BY id`
        ).all();

        const answers = await env.DB.prepare(
          `SELECT id, name, is_active FROM answer_choices ${whereClause} ORDER BY id`
        ).all();

        return jsonResponse({
          stores: stores.results || [],
          brands: brands.results || [],
          answerChoices: answers.results || [],
        });
      }

      // 2. GET /api/stores
      if (method === "GET" && path === "/api/stores") {
        const includeInactive = url.searchParams.get("includeInactive") === "true";
        const whereClause = includeInactive ? "" : "WHERE is_active = 1";

        const { results } = await env.DB.prepare(
          `SELECT id, region, mall, province, store_name, is_active FROM stores ${whereClause} ORDER BY mall, region, store_name`
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
          "SELECT id, store_id, last_update, user, phone FROM survey_header WHERE store_id = ?"
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

      // 4. POST /api/survey - Save survey (filter out 0 values)
      if (method === "POST" && path === "/api/survey") {
        const body: any = await request.json();
        const { storeId, user, phone, details } = body;

        if (!storeId || !Array.isArray(details)) {
          return jsonResponse({ error: "Missing storeId or details array" }, 400);
        }

        const userName = user && user.trim() ? user.trim() : "user";
        const phoneNum = phone && phone.trim() ? phone.trim() : "";
        const now = new Date().toISOString();

        // Check existing header
        let header: any = await env.DB.prepare(
          "SELECT id FROM survey_header WHERE store_id = ?"
        ).bind(storeId).first();

        let surveyId: number;

        if (header) {
          surveyId = header.id;
          await env.DB.prepare(
            "UPDATE survey_header SET last_update = ?, user = ?, phone = ? WHERE id = ?"
          ).bind(now, userName, phoneNum, surveyId).run();
        } else {
          const res = await env.DB.prepare(
            "INSERT INTO survey_header (store_id, last_update, user, phone) VALUES (?, ?, ?, ?)"
          ).bind(storeId, now, userName, phoneNum).run();
          surveyId = res.meta.last_row_id;
        }

        // Overwrite existing details for this survey
        await env.DB.prepare(
          "DELETE FROM survey_detail WHERE survey_id = ?"
        ).bind(surveyId).run();

        // Insert ONLY details with value > 0
        const statements = [];
        for (const item of details) {
          const brandId = parseInt(item.brandId, 10);
          const choiceId = parseInt(item.answerChoiceId, 10);
          const val = parseInt(item.value, 10);

          if (!isNaN(brandId) && !isNaN(choiceId) && !isNaN(val) && val > 0) {
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

      // 6. GET /api/admin/stats - Executive Summary & Dashboard Charts Data
      if (method === "GET" && path === "/api/admin/stats") {
        const totalStoresRes: any = await env.DB.prepare("SELECT COUNT(*) as count FROM stores WHERE is_active = 1").first();
        const totalSurveysRes: any = await env.DB.prepare("SELECT COUNT(*) as count FROM survey_header").first();
        const totalPcRes: any = await env.DB.prepare("SELECT COALESCE(SUM(value), 0) as total FROM survey_detail WHERE value > 0").first();

        // PC Count by Brand
        const byBrandRes = await env.DB.prepare(`
          SELECT b.id, b.name, COALESCE(SUM(sd.value), 0) as total_pc
          FROM brands b
          LEFT JOIN survey_detail sd ON b.id = sd.brand_id AND sd.value > 0
          WHERE b.is_active = 1
          GROUP BY b.id, b.name
          ORDER BY total_pc DESC, b.name
        `).all();

        // PC Count by PC Choice / Employment Type
        const byChoiceRes = await env.DB.prepare(`
          SELECT ac.id, ac.name, COALESCE(SUM(sd.value), 0) as total_pc
          FROM answer_choices ac
          LEFT JOIN survey_detail sd ON ac.id = sd.answer_choice_id AND sd.value > 0
          WHERE ac.is_active = 1
          GROUP BY ac.id, ac.name
          ORDER BY ac.id
        `).all();

        // PC Count by Region
        const byRegionRes = await env.DB.prepare(`
          SELECT s.region, COUNT(DISTINCT sh.id) as survey_count, COALESCE(SUM(sd.value), 0) as total_pc
          FROM stores s
          LEFT JOIN survey_header sh ON s.id = sh.store_id
          LEFT JOIN survey_detail sd ON sh.id = sd.survey_id AND sd.value > 0
          WHERE s.is_active = 1
          GROUP BY s.region
          ORDER BY total_pc DESC
        `).all();

        return jsonResponse({
          totalStores: totalStoresRes?.count || 0,
          totalSurveys: totalSurveysRes?.count || 0,
          totalPC: totalPcRes?.total || 0,
          byBrand: byBrandRes.results || [],
          byChoice: byChoiceRes.results || [],
          byRegion: byRegionRes.results || [],
        });
      }

      // 7. POST /api/admin/dimension/toggle
      if (method === "POST" && path === "/api/admin/dimension/toggle") {
        const body: any = await request.json();
        const { dimension, id, isActive } = body;

        const allowedTables: Record<string, string> = {
          stores: "stores",
          brands: "brands",
          answerChoices: "answer_choices",
          answer_choices: "answer_choices",
        };

        const table = allowedTables[dimension];
        if (!table || !id) {
          return jsonResponse({ error: "Invalid dimension table or ID" }, 400);
        }

        const activeVal = isActive ? 1 : 0;
        await env.DB.prepare(`UPDATE ${table} SET is_active = ? WHERE id = ?`)
          .bind(activeVal, id)
          .run();

        return jsonResponse({ success: true, dimension: table, id, isActive: activeVal === 1 });
      }

      // 8. POST /api/admin/import/stores
      if (method === "POST" && path === "/api/admin/import/stores") {
        const csvText = await request.text();
        const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          return jsonResponse({ error: "CSV file is empty or missing data" }, 400);
        }

        const batch: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length >= 4) {
            const [storeName, mall, province, region] = cols;
            batch.push(
              env.DB.prepare(
                "INSERT INTO stores (region, mall, province, store_name, is_active) VALUES (?, ?, ?, ?, 1)"
              ).bind(region, mall, province, storeName)
            );
          }
        }

        if (batch.length > 0) {
          for (let i = 0; i < batch.length; i += 50) {
            await env.DB.batch(batch.slice(i, i + 50));
          }
        }

        return jsonResponse({ success: true, imported: batch.length });
      }

      // 9. POST /api/admin/import/brands
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
                "INSERT OR IGNORE INTO brands (name, is_active) VALUES (?, 1)"
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

      // 10. POST /api/admin/import/answers
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
                "INSERT OR IGNORE INTO answer_choices (name, is_active) VALUES (?, 1)"
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

      // 11. POST /api/admin/reset-dimensions
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

      // 12. GET /api/admin/surveys (1 line per survey/user)
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
            sh.phone,
            COALESCE(SUM(sd.value), 0) as total_pc,
            GROUP_CONCAT(b.name || ' (' || ac.name || '=' || sd.value || ')', ', ') as summary
          FROM survey_header sh
          JOIN stores s ON sh.store_id = s.id
          LEFT JOIN survey_detail sd ON sh.id = sd.survey_id AND sd.value > 0
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
          query += " AND sh.id IN (SELECT survey_id FROM survey_detail WHERE brand_id = ? AND value > 0)";
          params.push(parseInt(brandFilter, 10));
        }

        query += " GROUP BY sh.id ORDER BY sh.last_update DESC, s.mall, s.region, s.store_name";

        const stmt = env.DB.prepare(query);
        const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

        return jsonResponse({ results: results || [] });
      }

      // 13. GET /api/admin/export - Includes STORE_ID and STORE_NAME in exported CSV
      if (method === "GET" && path === "/api/admin/export") {
        const query = `
          SELECT 
            s.id as store_id,
            s.store_name,
            s.region,
            s.mall,
            s.province,
            sh.last_update,
            sh.user,
            sh.phone,
            b.name as brand_name,
            ac.name as answer_choice_name,
            sd.value
          FROM survey_header sh
          JOIN stores s ON sh.store_id = s.id
          JOIN survey_detail sd ON sh.id = sd.survey_id AND sd.value > 0
          JOIN brands b ON sd.brand_id = b.id
          JOIN answer_choices ac ON sd.answer_choice_id = ac.id
          ORDER BY s.region, s.mall, s.store_name, b.id, ac.id
        `;

        const { results } = await env.DB.prepare(query).all();

        let csv = "\uFEFFSTORE_ID,STORE_NAME,ภูมิภาค,ห้าง,จังหวัด,วันที่อัปเดต,ผู้กรอก,เบอร์โทร,แบรนด์,ประเภทPC,จำนวน\n";
        if (results) {
          for (const r of results as any[]) {
            const line = [
              `"${r.store_id ?? ''}"`,
              `"${r.store_name || ''}"`,
              `"${r.region || ''}"`,
              `"${r.mall || ''}"`,
              `"${r.province || ''}"`,
              `"${r.last_update || ''}"`,
              `"${r.user || ''}"`,
              `"${r.phone || ''}"`,
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

      // 14. DELETE /api/admin/survey/:surveyId
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

      // 15. DELETE /api/admin/clear
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
