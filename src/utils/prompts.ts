export const generate_3d_printable_prompt = `Analyze the provided photo and create a Chibi-style 3D printable figurine scene.

Instructions:
Identify the PRIMARY subjects that would work as standalone figurines (maximum 5)
Consider each subject as a complete, unified object - do not separate clothing, accessories, or held items from their owner
Generate detailed image prompts that will produce simple, 3D-printable Chibi figurines

For each object, create a prompt that:
- Explicitly mentions "Chibi style 3D figurine"
- Describes the subject as a unified whole
- Emphasizes rounded, simplified geometry
- Includes key identifying features but simplifies complex details
- Specifies a white background
- Uses descriptive, narrative language (not keywords)

Please provide:
Scene Overview: [1-2 sentences describing the original photo]
Identified Objects: [List the 1-5 main subjects]

Generation Prompts:
For each object, provide:
Object Name: [Simple identifier]
Prompt: [Full descriptive prompt following the guidelines above]

Focus only on subjects that are:
- In the foreground or mid-ground
- Large enough to be meaningful when printed
- Complete entities (not parts or accessories)
- Suitable for standalone display

Ignore:
- Backgrounds, walls, floors
- Small accessories that aren't held/worn
- Architectural elements
- Plants, trees, decorative elements
- Any objects that would be too thin or fragile when printed`;

export const generate_product_photoshoot_scene_prompt = `Generate a product photoshoot in the style of these reference objects, arrange them so that they reflect the reference scene
<reference>
The photo shows a man, likely a sound technician, sitting behind a large audio mixing console and working on a laptop. He is focused on his task, with a microphone positioned near him.
</reference>
Do not generate any new objects:
Arrange these objects together to reflect the reference
You can add an out-of-focus background, but it should be clearly seperate from the objects
Think out loud at length about how to do this, then return the image.`
