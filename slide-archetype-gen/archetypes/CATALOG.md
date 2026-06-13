# Archetype Catalog — 流派索引（選定用）

トピックを **mood × docType × industry × color** で照合し、合う流派を1つ（多くて2つ）選ぶ。
各流派の規範値は `<slug>/DESIGN.md`、実装例は `<slug>/sample.html`。
**外部の実デッキは取りに行かない。** 参照はここに同梱した定義だけ。

## 用途別クイック選定

| 用途 | 第一候補 | 代替 |
|---|---|---|
| プロダクト発表・キーノート | `apple-keynote-minimal` | `futuristic-ai` / `maximalist-gradient` |
| ディープテック/AIのビジョン | `futuristic-ai` | `data-dashboard-dark` |
| SaaS会社紹介・採用 | `trust-saas` | `gamma-card` / `pop-friendly` |
| 投資家ピッチ（シード/シリーズ） | `pitch-deck` | `futuristic-ai` |
| IR・決算説明 | `japan-ir` | `data-dashboard-dark` |
| 統合報告書・サステナ | `integrated-report` | `editorial-magazine` |
| コンサル提案・戦略 | `mbb-consulting` | `washei-consulting` / `swiss-international` |
| 高密度な日本式提案資料 | `washei-consulting` | `mbb-consulting` |
| ブランドブック・高級 | `luxury-premium` | `editorial-magazine` |
| エディトリアル/読み物 | `editorial-magazine` | `luxury-premium` |
| イベント告知・クリエイティブ | `maximalist-gradient` | `neo-brutalist` / `pop-friendly` |
| 親しみやすい消費者向け | `pop-friendly` | `gamma-card` |
| 客観的でタイポ主導 | `swiss-international` | `systematic-autolayout` |
| 崩れない汎用ビジネス（迷ったら） | `marketplace-generalist` | `systematic-autolayout` |

## 全18流派（タグ）

凡例: density / mood / style / docType / industry / color

### apple-keynote-minimal — Apple Keynote Minimal
1スライド1メッセージ（しばしば1語・1数値）の映画的ミニマル。漆黒/全面ビジュアル、感情＞情報。
- density: very-low ・ mood: cinematic, calm, premium, focused, emotional
- style: minimal, luxury, futuristic ・ docType: pitch, service, keynote
- industry: consumer-tech, hardware, ai, design ・ color: monochrome, dark

### data-dashboard-dark — Data Dashboard (Dark)
BIダッシュボードの文法を持ち込んだ高密度・ダーク定量表示。KPIカード+チャート群、ネオン強調。
- density: high ・ mood: analytical, focused, technical, premium, data-dense
- style: futuristic, trust, dynamic, clear ・ docType: ir, exec-review, ops-review, board-update, pitch
- industry: saas, ai, finance, infrastructure ・ color: dark, navy, neon-accent, three-tone

### editorial-magazine — Editorial / Magazine
温かくミニマルで手触りのあるエディトリアル。暖色オフホワイト、セリフ見出し+ドロップキャップ、多段組。
- density: medium ・ mood: warm, calm, editorial, tactile, honest, refined
- style: minimal, editorial, natural, warm, luxury ・ docType: brand-book, integrated-report, magazine, company-intro, culture
- industry: lifestyle, craft, retail, food, hospitality ・ color: brown, natural, off-white, two-tone

### futuristic-ai — Futuristic AI Tech
ディープテック/AIの「前進する未来」。漆黒に近い地にグラデ/グロー、エネルギッシュ。
- density: medium ・ mood: futuristic, energetic, innovative, technical, premium
- style: futuristic, dynamic, trust ・ docType: pitch, service, product-launch, vision
- industry: ai, saas, deep-tech, web3 ・ color: dark, gradient, two-tone

### gamma-card — Gamma-style Card / Web-native
1スライド＝1枚のクリーンな角丸カード。カード積層、テーマ駆動の柔らかい配色。
- density: low ・ mood: soft, modern, friendly, airy, web-native, approachable
- style: soft, modern, minimal, friendly ・ docType: company-intro, service, knowledge-base, product, pitch
- industry: saas, ai, edtech, productivity ・ color: pastel, gradient, soft-violet, light

### integrated-report — Integrated Report
価値創造ストーリーをエディトリアルに語る。全面写真+ブランドレッド、KPI、章扉巨大番号。
- density: medium ・ mood: trustworthy, expansive, story-led, premium, editorial
- style: trust, premium, editorial, clear ・ docType: integrated-report, ir, company-intro, sustainability
- industry: aviation, mobility, manufacturing, infrastructure, finance ・ color: red, navy, photo, two-tone

### japan-ir — Japan IR（決算説明資料）
正確で一目で追える業績報告。ブランド色+グレー、章扉とKPI要約、大きく清潔なグラフ。
- density: medium-high ・ mood: trustworthy, accurate, calm, data-led, conservative
- style: trust, clear, minimal ・ docType: ir, earnings, mid-term-plan, company-intro
- industry: finance, saas, manufacturing, retail ・ color: navy, blue, two-tone

### luxury-premium — Luxury / Premium
抑制＝高級。漆黒/クリーム+金、Didoneセリフ大見出し、巨大余白。
- density: very-low ・ mood: elegant, restrained, cinematic, confident, timeless, refined
- style: luxury, minimal, editorial, premium ・ docType: brand-book, lookbook, company-intro, pitch
- industry: beauty, fashion, cosmetics, hospitality, jewelry ・ color: black, cream, gold, two-tone

### marketplace-generalist — Template-Marketplace Generalist
1テーマで全スライド種を網羅する万能型。白地+藍系、崩れにくい。迷ったらこれ。
- density: medium ・ mood: friendly, versatile, approachable, cohesive, professional
- style: friendly, clear, pop, versatile ・ docType: company-intro, pitch, proposal, service, general-business
- industry: generic, saas, agency, education, nonprofit ・ color: indigo, multi, two-tone

### maximalist-gradient — Maximalist Gradient
鮮烈グラデ+抽象シェイプ。目を引くイベント/ブランド表現。
- density: low ・ mood: vibrant, expressive, bold, playful, energetic
- style: pop, dynamic, bold, colorful ・ docType: event, pitch, service, brand
- industry: creative, media, music, design, community ・ color: gradient, pink, purple, cyan

### mbb-consulting — MBB Consulting
タイトル自体が結論（アクションタイトル）+水平フロー、Mintoピラミッド。
- density: medium-high ・ mood: austere, rigorous, analytical, authoritative, restrained
- style: trust, minimal, clear ・ docType: proposal, strategy, mid-term-plan, ir, diligence
- industry: consulting, finance, manufacturing, saas ・ color: navy, two-tone, monochrome

### neo-brutalist — Neo-Brutalist / Anti-Design
太い黒の全周ボーダー、硬い影、巨大タイポ、意図的な摩擦。
- density: low ・ mood: bold, raw, confident, playful, high-contrast, anti-corporate
- style: bold, dynamic, pop ・ docType: pitch, service, product-launch, recruit
- industry: saas, ai, dev-tool, creative-tech ・ color: two-tone, primary, yellow, monochrome

### pitch-deck — Startup Pitch Deck (Sequoia / YC)
固定ナラティブ、1スライド1論点、ヒーロー数値。
- density: very-low ・ mood: confident, bold, clear, ambitious, direct
- style: minimal, bold, clear ・ docType: pitch, fundraising, business-plan
- industry: saas, ai, fintech, logistics ・ color: two-tone, electric-blue, monochrome

### pop-friendly — Pop Friendly
明るいミント/ターコイズ+黒+黄マーカー。親しみやすい消費者向け会社紹介。
- density: medium ・ mood: friendly, energetic, approachable, warm, optimistic
- style: pop, easy-natural, clear ・ docType: company-intro, recruit, service
- industry: consumer, food, lifestyle, hr ・ color: green, two-tone, colorful

### swiss-international — Swiss International Typographic
数理的グリッド・客観性・装飾排除・赤一点。あらゆる clean corporate の祖。
- density: low ・ mood: objective, timeless, rigorous, calm, confident
- style: minimal, trust, clear ・ docType: company-intro, service, proposal, pitch
- industry: saas, design, consulting, manufacturing ・ color: monochrome, red-accent

### systematic-autolayout — Systematic Auto-Layout
構造優先・完璧な整列・等間隔・反復、崩れないブランド一貫性（Beautiful.ai 風）。
- density: medium ・ mood: calm, systematic, consistent, on-brand, precise
- style: trust, clear, minimal, systematic ・ docType: business-review, company-intro, service, proposal
- industry: saas, ai, finance ・ color: indigo, two-tone

### trust-saas — Trust SaaS
信頼感+先進性。フルブリードの青→水色グラデ表紙、青見出し、グラデパネル。
- density: medium ・ mood: trustworthy, modern, clean, confident, approachable
- style: trust, clear, stylish ・ docType: company-intro, recruit, service
- industry: saas, ai, finance, hr ・ color: blue, gradient

### washei-consulting — Washei Consulting（和製コンサル 高密度）
上端タイトル+キーメッセージ帯+図解。一人歩きする高密度資料。
- density: high ・ mood: trustworthy, logical, dense, authoritative, structured
- style: trust, clear, dynamic ・ docType: proposal, company-intro, service, mid-term-plan
- industry: consulting, saas, finance, manufacturing ・ color: navy, two-tone
