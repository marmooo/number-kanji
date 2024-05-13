import { filterGlyphs, parse, toSVG } from "npm:@marmooo/ttf2svg@0.2.1";
import { JISCode } from "npm:@marmooo/kanji@0.0.8";

function loadKanjiList() {
  let chars =
    "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵ";
  JISCode.forEach((list) => {
    chars += list.join("");
  });
  return chars;
}

function parseTTF(inFile, outDir, options = {}) {
  Deno.mkdirSync(outDir, { recursive: true });
  const uint8array = Deno.readFileSync(inFile);
  const font = parse(uint8array.buffer);
  const glyphs = filterGlyphs(font, options);
  for (const glyph of glyphs) {
    if (!glyph.unicode) continue;
    const svg = toSVG(font, glyph, options);
    if (!svg) continue;
    const { x1 } = glyph.getBoundingBox();
    const fileName = Number(glyph.unicode).toString(16);
    const char = String.fromCodePoint(glyph.unicode);
    if (x1 < 0) {
      console.log("x1", x1, glyph.unicode, fileName, char);
      continue;
    }
    Deno.writeTextFileSync(`${outDir}/${fileName}.svg`, svg);
  }
}

function notoSerifJP(text) {
  console.log("Noto Serif JP");
  const options = { text, glyphHeight: 1000, translateY: 850 };
  parseTTF(
    "vendor/NotoSerifJP-Regular.otf",
    "svg/noto-serif-jp",
    options,
  );
}

function notoSansJP(text) {
  console.log("Noto Sans JP");
  const options = { text, glyphHeight: 1000, translateY: 850 };
  parseTTF(
    "vendor/NotoSansJP-Regular.otf",
    "svg/noto-sans-jp",
    options,
  );
}

const text = loadKanjiList();
console.log(text.length);
notoSerifJP(text);
notoSansJP(text);
