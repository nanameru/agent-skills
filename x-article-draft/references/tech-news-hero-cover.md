# Tech-news hero cover

Use for AI models, developer tools, product integrations, implementation guides, and technical announcements.

## Input sheet

```yaml
article_topic: ""
official_product_name: ""
reader_outcome: ""
kicker: ""
headline_line_1: ""
headline_line_2: ""
brand_colored_phrase: ""
official_brand_color: ""
official_motif: ""
motif_source_url: ""
supporting_environment: ""
verified_claim_source: ""
```

Rules:

- Make the headline a conclusion, not a list of features.
- Use two or three headline lines.
- Color only one word or short phrase with the official brand color.
- Use a kicker only when its date, number, status, or claim is verified.
- Prefer an official icon, mascot, product interface, or recognizable product motif.
- Use a neutral functional symbol when official asset rights or identity are unclear.

## Fixed composition

- Background: near-black with generous negative space.
- Left 55–60%: oversized bold white headline and optional small outlined kicker.
- Right 40–45%: one large recognizable motif, slightly cropped for scale.
- Lighting: restrained brand-colored glow may connect the motif to a relevant interface, portal, code editor, or data flow.
- Dominant elements: headline and motif only.
- Canvas: 2000 x 800 pixels with an exact 5:2 ratio.

## Generation prompt template

```text
Create an exact 5:2 editorial hero cover, 2000 x 800 pixels, for a Japanese X Article.

Topic: [article_topic]
Background: near-black, spacious, high-contrast technical editorial design.

Left 55–60%:
- an optional small outlined kicker reading exactly: "[kicker]"
- an oversized bold Japanese headline in two or three lines:
  "[headline_line_1]"
  "[headline_line_2]"
- render only "[brand_colored_phrase]" in [official_brand_color]; all other headline text is white
- keep the headline readable as a small mobile thumbnail

Right 40–45%:
- one large recognizable [official_motif] based on the supplied official reference
- use controlled depth and [official_brand_color] light
- connect the motif visually to [supporting_environment]
- allow slight cropping at the right edge

Do not add fake logos, generic AI cubes, random circuit boards, floating cards, or extra text.
```

## QA

- Exact 5:2 dimensions.
- Subject recognizable in one second.
- Thesis understandable in three seconds.
- Headline readable on mobile.
- Only one brand-colored phrase.
- Motif is large and relevant.
- Kicker claim is sourced.
- No fake or malformed marks.
- Japanese and product spelling are exact.
