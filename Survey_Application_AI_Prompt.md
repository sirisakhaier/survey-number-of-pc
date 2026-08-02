# AI Coding Prompt: Survey Application

Build a responsive survey web application using **GitHub + Cloudflare
Pages + Cloudflare Workers + Cloudflare D1** (no Supabase).

## Features

-   Multi-user survey.
-   Landing page:
    -   Select **ภูมิภาค**, **ห้าง**, **สาขา** (cascading dropdowns from
        imported store dimension).
    -   If store already has answers, load existing values for editing.
    -   Otherwise create new.
-   Survey page:
    -   Cross-tab table.
    -   Rows = Brands (from Dimension Brand.csv).
    -   Columns = Answer Choices (from Dimension Answer.csv).
    -   Each cell accepts integer values.
    -   Save button validates numeric values.
-   Store one survey per store. Updating overwrites previous values.

## Admin

Login from landing page using password `admin1234` (implement as
environment variable for production).

Functions: 1. Import Dimension Store CSV. 2. Import Dimension Brand CSV.
3. Import Dimension Answer CSV. 4. Reset all dimensions. 5. Browse
survey results. 6. Filter by Region, Store, Brand. 7. Export CSV. 8.
Delete selected survey. 9. Clear all survey data.

## Database

Tables: - stores(id, region, mall, store_name) - brands(id,name) -
answer_choices(id,name) - survey_header(id,store_id,last_update,user) -
survey_detail(id,survey_id,brand_id,answer_choice_id,value)

Unique: survey_detail(survey_id,brand_id,answer_choice_id)

## UI

-   Mobile-first.
-   Large buttons.
-   Sticky header.
-   Toast notifications.
-   Loading spinner.
-   Responsive admin table.

## Tech

-   HTML5
-   TypeScript
-   Cloudflare Workers API
-   Cloudflare D1
-   Cloudflare Pages
-   Vanilla JS (no React)
-   CSV import/export
-   GitHub Actions deployment

## API

GET /api/stores GET /api/survey/:storeId POST /api/survey POST
/api/admin/import/\* GET /api/admin/export DELETE /api/admin/clear

## Deliverables

-   Complete source code
-   SQL migration
-   README
-   Sample CSV import
-   Installation guide
-   GitHub ready
-   Cloudflare deployment ready
