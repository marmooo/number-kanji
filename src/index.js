import svgpath from "https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";

const courseNode = document.getElementById("course");
const audioContext = new AudioContext();
const audioBufferCache = {};
loadAudio("error", "/number-kanji/mp3/boyon1.mp3");
loadAudio("correct1", "/number-kanji/mp3/pa1.mp3");
loadAudio("correct2", "/number-kanji/mp3/papa1.mp3");
loadAudio("correctAll", "/number-kanji/mp3/levelup1.mp3");
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
}

function changeLang() {
  const langObj = document.getElementById("lang");
  const lang = langObj.options[langObj.selectedIndex].value;
  location.href = `/number-kanji/${lang}/`;
}

export class Circle {
  constructor(cx, cy, rx, ry) {
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
  }

  toSVG() {
    return `<path d="${this.d()}"/>`;
  }

  d() {
    return this.toArray().map((line) => line.join(" ")).join(" ");
  }
}

export class TwoArcsCircle extends Circle {
  constructor(cx, cy, rx, ry) {
    super(cx, cy, rx, ry);
  }

  toArray() {
    const { cx, cy, rx, ry } = this;
    return [
      ["M", cx - rx, cy],
      ["A", rx, ry, 0, 1, 0, cx + rx, cy],
      ["A", rx, ry, 0, 1, 0, cx - rx, cy],
    ];
  }
}

export class CubicBezierCircle extends Circle {
  static KAPPA = (-1 + Math.sqrt(2)) / 3 * 4;

  constructor(cx, cy, rx, ry) {
    super(cx, cy, rx, ry);
  }

  toArray() {
    const { cx, cy, rx, ry } = this;
    const kappa = CubicBezierCircle.KAPPA;
    return [
      ["M", cx - rx, cy],
      ["C", cx - rx, cy - kappa * ry, cx - kappa * rx, cy - ry, cx, cy - ry],
      ["C", cx + kappa * rx, cy - ry, cx + rx, cy - kappa * ry, cx + rx, cy],
      ["C", cx + rx, cy + kappa * ry, cx + kappa * rx, cy + ry, cx, cy + ry],
      ["C", cx - kappa * rx, cy + ry, cx - rx, cy + kappa * ry, cx - rx, cy],
    ];
  }
}

export class QuadBezierCircle extends Circle {
  constructor(cx, cy, rx, ry, segments = 8) {
    super(cx, cy, rx, ry);
    this.segments = segments;
  }

  toArray() {
    const ANGLE = 2 * Math.PI / this.segments;
    const { cx, cy, rx, ry } = this;
    const calculateControlPoint = (theta) => {
      const ax = rx * Math.cos(theta);
      const ay = ry * Math.sin(theta);
      const cpx = ax + rx * Math.tan(ANGLE / 2) * Math.cos(theta - Math.PI / 2);
      const cpy = ay + ry * Math.tan(ANGLE / 2) * Math.sin(theta - Math.PI / 2);
      return [cpx, cpy, ax, ay];
    };

    const pathData = [["M", cx + rx, cy]];
    for (let index = 1; index <= this.segments; index++) {
      const theta = index * ANGLE;
      const [cpx, cpy, ax, ay] = calculateControlPoint(theta);
      pathData.push(["Q", cpx + cx, cpy + cy, ax + cx, ay + cy]);
    }
    return pathData;
  }

  range(from, to) {
    const d = to - from;
    return [...Array(d + 1).keys()].map((n) => n + from);
  }
}

function selectCircle(cx, cy, rx, ry, options) {
  const segments = options.circleSegments || 8;
  switch (options.circleAlgorithm) {
    case "TwoArcs":
      return new TwoArcsCircle(cx, cy, rx, ry);
    case "CubicBezier":
      return new CubicBezierCircle(cx, cy, rx, ry);
    case "QuadBezier":
      return new QuadBezierCircle(cx, cy, rx, ry, segments);
    default:
      return new TwoArcsCircle(cx, cy, rx, ry);
  }
}

export function circleToPath(node, createPathFunc, options) {
  const cx = Number(node.getAttribute("cx"));
  const cy = Number(node.getAttribute("cy"));
  const r = Number(node.getAttribute("r"));
  const d = selectCircle(cx, cy, r, r, options).d();
  const path = createPathFunc(node);
  path.setAttribute("d", d);
  ["cx", "cy", "r"].forEach((attribute) => {
    path.removeAttribute(attribute);
  });
  node.replaceWith(path);
  return path;
}

export function ellipseToPath(node, createPathFunc, options) {
  const cx = Number(node.getAttribute("cx"));
  const cy = Number(node.getAttribute("cy"));
  const rx = Number(node.getAttribute("rx"));
  const ry = Number(node.getAttribute("ry"));
  const d = selectCircle(cx, cy, rx, ry, options).d();
  const path = createPathFunc(node);
  path.setAttribute("d", d);
  ["cx", "cy", "rx", "ry"].forEach((attribute) => {
    path.removeAttribute(attribute);
  });
  node.replaceWith(path);
  return path;
}

export function rectToPath(node, createPathFunc) {
  const x = Number(node.getAttribute("x")) || 0;
  const y = Number(node.getAttribute("y")) || 0;
  const width = Number(node.getAttribute("width"));
  const height = Number(node.getAttribute("height"));
  const ax = Number(node.getAttribute("rx"));
  const ay = Number(node.getAttribute("ry"));
  const rx = Math.min(ax || ay || 0, width / 2);
  const ry = Math.min(ay || ax || 0, height / 2);

  let d;
  if (rx === 0 || ry === 0) {
    d = `M${x} ${y}h${width}v${height}h${-width}z`;
  } else {
    d = `M${x} ${y + ry}
a${rx} ${ry} 0 0 1 ${rx} ${-ry}
h${width - rx - rx}
a${rx} ${ry} 0 0 1 ${rx} ${ry}
v${height - ry - ry}
a${rx} ${ry} 0 0 1 ${-rx} ${ry}
h${rx + rx - width}
a${rx} ${ry} 0 0 1 ${-rx} ${-ry}
z`;
  }
  const path = createPathFunc(node);
  path.setAttribute("d", d);
  ["cx", "cy", "r"].forEach((attribute) => {
    path.removeAttribute(attribute);
  });
  node.replaceWith(path);
  return path;
}

export function lineToPath(node, createPathFunc) {
  const x1 = node.getAttribute("x1");
  const y1 = node.getAttribute("y1");
  const x2 = node.getAttribute("x2");
  const y2 = node.getAttribute("y2");
  const d = `M${x1} ${y1}L${x2} ${y2}`;
  const path = createPathFunc(node);
  path.setAttribute("d", d);
  ["x1", "y1", "x2", "y2"].forEach((attribute) => {
    path.removeAttribute(attribute);
  });
  node.replaceWith(path);
  return path;
}

export function polylineToPath(node, createPathFunc) {
  const points = node.getAttribute("points")
    .trim().replaceAll(",", " ").split(/\s+/).map(Number);
  const xy1 = points.slice(0, 2).join(" ");
  const xy2 = points.slice(2).join(" ");
  let d = `M${xy1}L${xy2}`;
  if (node.tagName.toLowerCase() === "polygon") d += "z";
  const path = createPathFunc(node);
  path.setAttribute("d", d);
  path.removeAttribute("points");
  node.replaceWith(path);
  return path;
}

function* traverse(element) {
  yield element;
  const childNodes = element.childNodes;
  if (childNodes) {
    for (let i = 0; i < childNodes.length; i++) {
      yield* traverse(childNodes[i]);
    }
  }
}

export function shape2path(doc, createPathFunc, options = {}) {
  for (const node of traverse(doc)) {
    if (!node.tagName) continue;
    switch (node.tagName.toLowerCase()) {
      case "rect":
        rectToPath(node, createPathFunc);
        break;
      case "circle":
        circleToPath(node, createPathFunc, options);
        break;
      case "ellipse":
        ellipseToPath(node, createPathFunc, options);
        break;
      case "line":
        lineToPath(node, createPathFunc);
        break;
      case "polyline":
      case "polygon":
        polylineToPath(node, createPathFunc);
        break;
    }
  }
}

function createPath(node) {
  const path = document.createElementNS(svgNamespace, "path");
  for (const attribute of node.attributes) {
    path.setAttribute(attribute.name, attribute.value);
  }
  return path;
}

function isOverlapped(target, rect) {
  return target.some((targetRect) =>
    !(targetRect.right <= rect.left ||
      targetRect.left >= rect.right ||
      targetRect.bottom <= rect.top ||
      targetRect.top >= rect.bottom)
  );
}

function addNumber(x, y, r, i, pathIndex, display) {
  const text = document.createElementNS(svgNamespace, "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", r);
  text.style.display = display;
  text.style.cursor = "pointer";
  text.textContent = i;
  text.onclick = () => {
    if (clickIndex + 1 != i) {
      playAudio("error");
      return;
    }
    clickIndex += 1;
    const currPath = problem[pathIndex].path;
    if (segmentIndex != 1) currPath.nextElementSibling.remove();
    text.style.cursor = "initial";
    text.setAttribute("fill-opacity", 0.5);
    text.onclick = null;

    const path = createPath(problem[pathIndex].path);
    resetCurrentColor(path);
    path.style.fill = "";
    path.style.stroke = "";
    const pathData = svgpath.from(problem[pathIndex].pathData);
    pathData.segments = pathData.segments.slice(0, segmentIndex);
    const d = pathData.toString();
    path.setAttribute("d", d);
    currPath.after(path);

    if (segmentIndex == problem[pathIndex].pathData.segments.length) {
      problem[pathIndex].texts.forEach((prevText) => {
        prevText.remove();
      });
      if (pathIndex + 1 == problem.length) {
        playAudio("correctAll");
      } else {
        playAudio("correct2");
        currPathIndex += 1;
        segmentIndex = 1;
        problem[currPathIndex].texts.forEach((currText) => {
          currText.style.display = "initial";
        });
      }
    } else {
      playAudio("correct1");
      segmentIndex += 1;
    }
  };
  svg.appendChild(text);
  return text;
}

function getAccessList(n) {
  const list = new Array(n * 2 + 1);
  for (let x = -n; x <= n; x++) {
    for (let y = -n; y <= n; y++) {
      const distance = Math.abs(x) + Math.abs(y);
      if (list[distance]) {
        list[distance].push([x, y]);
      } else {
        list[distance] = [[x, y]];
      }
    }
  }
  return list;
}

function replaceNumber(numbers, rect, width, fontSize) {
  const newRect = structuredClone(rect);
  for (const positions of accessList) {
    for (const [x, y] of positions) {
      const dx = width * x;
      const dy = fontSize * y;
      newRect.left = rect.left + dx;
      newRect.right = rect.right + dx;
      newRect.top = rect.top + dy;
      newRect.bottom = rect.bottom + dy;
      if (!isOverlapped(numbers, newRect)) return newRect;
    }
  }
  return newRect;
}

function getSegmentRects(pathData, index, r) {
  const rects = [];
  const margin = 1;

  function getRect(x, y, r) {
    const w = (index.toString().length / 2 + margin) * r;
    const w2 = w / 2;
    const rect = { left: x - w2, top: y - r, right: x + w2, bottom: y + r };
    const newRect = replaceNumber(rects, rect, w, r);
    return newRect;
  }

  let x = 0;
  let y = 0;
  pathData.segments.forEach((segment) => {
    switch (segment[0]) {
      case "H":
        x = segment[1];
        rects.push(getRect(x, y, r));
        break;
      case "h":
        x += segment[1];
        rects.push(getRect(x, y, r));
        break;
      case "V":
        y = segment[1];
        rects.push(getRect(x, y, r));
        break;
      case "v":
        y += segment[1];
        rects.push(getRect(x, y, r));
        break;
      case "M":
      case "L":
      case "C":
      case "S":
      case "Q":
      case "T":
      case "A":
        x = segment.at(-2);
        y = segment.at(-1);
        rects.push(getRect(x, y, r));
        break;
      case "m":
      case "l":
      case "c":
      case "s":
      case "q":
      case "t":
      case "a":
        x += segment.at(-2);
        y += segment.at(-1);
        rects.push(getRect(x, y, r));
        break;
      case "Z":
      case "z":
        break;
    }
  });
  return rects;
}

function addNumbers(r) {
  let index = clickIndex + 1;
  problem.forEach((data, pathIndex) => {
    const pathData = svgpath(data.path.getAttribute("d"));
    const rects = getSegmentRects(pathData, index, r);

    const texts = [];
    const display = (pathIndex == 0) ? "initial" : "none";
    rects.forEach((rect) => {
      const left = rect.left + (rect.right - rect.left) / 2;
      const text = addNumber(left, rect.top + r, r, index, pathIndex, display);
      texts.push(text);
      index += 1;
    });

    pathData.segments = pathData.segments.filter((segment) =>
      !segment[0].match(/[zZ]/)
    );

    data.rects = rects;
    data.texts = texts;
    data.pathData = pathData;
  });
}

function getTransforms(node) {
  const transforms = [];
  while (node.tagName) {
    const transform = node.getAttribute("transform");
    if (transform) transforms.push(transform);
    node = node.parentNode;
  }
  return transforms.reverse();
}

function removeTransforms(svg) {
  for (const path of svg.getElementsByTagName("path")) {
    const d = path.getAttribute("d");
    const transforms = getTransforms(path);
    if (transforms.length > 0) {
      const newD = svgpath(d);
      transforms.forEach((transform) => {
        newD.transform(transform);
      });
      path.setAttribute("d", newD.toString());
    }
  }
  for (const node of svg.querySelectorAll("[transform]")) {
    node.removeAttribute("transform");
  }
}

function removeUseTags(svg) {
  const uses = [...svg.getElementsByTagName("use")];
  for (const use of uses) {
    let id = use.getAttributeNS(xlinkNamespace, "href").slice(1);
    if (!id) id = use.getAttribute("href").slice(1); // SVG 2
    if (!id) continue;
    const g = svg.getElementById(id).cloneNode(true);
    for (const attribute of use.attributes) {
      if (attribute.localName == "href") continue;
      g.setAttribute(attribute.name, attribute.value);
    }
    g.removeAttribute("id");
    use.replaceWith(g);
  }
}

// https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units
function lengthToPixel(str) {
  const x = parseFloat(str);
  switch (str.slice(0, -2)) {
    case "cm":
      return x / 96 * 2.54;
    case "mm":
      return x / 96 * 254;
    case "in":
      return x / 96;
    case "pc":
      return x * 16;
    case "pt":
      return x / 96 * 72;
    case "px":
      return x;
    default:
      return x;
  }
}

function getFontSize(svg) {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const width = Number(viewBox.split(" ")[2]);
    return width / 40;
  } else {
    const width = lengthToPixel(svg.getAttribute("width"));
    return width / 40;
  }
}

function setViewBox(svg) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  problem.forEach((data) => {
    data.rects.forEach((rect) => {
      const { left, top, right, bottom } = rect;
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (maxX < right) maxX = right;
      if (maxY < bottom) maxY = bottom;
    });
  });
  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.ceil(maxX);
  maxY = Math.ceil(maxY);
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
}

function hideIcon() {
  problem.forEach((data) => {
    const path = data.path;
    path.style.fill = "none";
    path.style.stroke = "none";
  });
}

async function fetchIconList(course) {
  const response = await fetch(`/number-kanji/data/${course}.txt`);
  const text = await response.text();
  return text.trimEnd().split("\n");
}

async function fetchIcon(url) {
  const response = await fetch(url);
  const svg = await response.text();
  return new DOMParser().parseFromString(svg, "image/svg+xml");
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
const presentationAttributes = new Set([
  "alignment-baseline",
  "baseline-shift",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "cursor",
  // "d",
  "direction",
  "display",
  "dominant-baseline",
  "enable-background",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "image-rendering",
  "kerning",
  "letter-spacing",
  "lighting-color",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mask",
  "opacity",
  "overflow",
  "pointer-events",
  "shape-rendering",
  "solid-color",
  "solid-opacity",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "transform",
  "unicode-bidi",
  "vector-effect",
  "visibility",
  "word-spacing",
  "writing-mode",
]);

function removeSvgTagAttributes(svg) {
  const candidates = [];
  [...svg.attributes].forEach((attribute) => {
    if (presentationAttributes.has(attribute.name)) {
      candidates.push(attribute);
      svg.removeAttribute(attribute.name);
    }
  });
  if (candidates.length > 0) {
    const g = document.createElementNS(svgNamespace, "g");
    candidates.forEach((attribute) => {
      g.setAttribute(attribute.name, attribute.value);
    });
    [...svg.children].forEach((node) => {
      g.appendChild(node);
    });
    svg.appendChild(g);
  }
}

function fixIconCode(svg) {
  const course = courseNode.options[courseNode.selectedIndex].value;
  if (course == "Solar-icon-set") {
    for (const node of svg.querySelectorAll("[fill=black]")) {
      node.setAttribute("fill", "gray");
    }
    for (const node of svg.querySelectorAll("[stroke=black]")) {
      node.setAttribute("stroke", "gray");
    }
  }
}

function computeAttribute(node, attributeName) {
  let attributeValue;
  while (!attributeValue && node && node.tagName) {
    attributeValue = node.getAttribute(attributeName);
    node = node.parentNode;
  }
  return attributeValue;
}

function resetCurrentColor(node) {
  const fill = computeAttribute(node, "fill");
  const stroke = computeAttribute(node, "stroke");
  if (fill && fill.toLowerCase() == "currentcolor") {
    node.setAttribute("fill", "gray");
  }
  if (stroke && stroke.toLowerCase() == "currentcolor") {
    node.setAttribute("stroke", "gray");
  }
}

function styleAttributeToAttributes(svg) {
  [...svg.querySelectorAll("[style]")].forEach((node) => {
    node.getAttribute("style").split(";").forEach((style) => {
      const [property, value] = style.split(":").map((str) => str.trim());
      if (presentationAttributes.has(property)) {
        node.setAttribute(property, value);
        node.style.removeProperty(property);
      }
    });
  });
}

async function nextProblem() {
  clickIndex = 0;
  segmentIndex = 1;
  currPathIndex = 0;
  const courseNode = document.getElementById("course");
  const course = courseNode.options[courseNode.selectedIndex].value;
  if (iconList.length == 0) {
    iconList = await fetchIconList(course);
  }
  const filePath = iconList[getRandomInt(0, iconList.length)];
  const url = `/svg/${course}/${filePath}`;
  const icon = await fetchIcon(url);
  svg = icon.documentElement;

  styleAttributeToAttributes(svg);
  if (!svg.getAttribute("fill")) svg.setAttribute("fill", "gray");
  resetCurrentColor(svg);
  removeSvgTagAttributes(svg);
  shape2path(svg, createPath, { circleAlgorithm: "QuadBezier" });
  removeUseTags(svg);
  removeTransforms(svg);
  problem = [];
  [...svg.getElementsByTagName("path")].forEach((path) => {
    problem.push({ path });
  });
  hideIcon(svg);
  fontSize = getFontSize(svg);
  addNumbers(fontSize);
  setViewBox(svg);

  svg.style.width = "100%";
  svg.style.height = "100%";
  document.getElementById("iconContainer").replaceChildren(svg);
}

async function changeCourse() {
  const course = courseNode.options[courseNode.selectedIndex].value;
  iconList = await fetchIconList(course);
  selectAttribution(courseNode.selectedIndex);
  nextProblem();
}

function selectRandomCourse() {
  const index = getRandomInt(0, courseNode.options.length);
  courseNode.options[index].selected = true;
  selectAttribution(index);
}

function selectAttribution(index) {
  const divs = [...document.getElementById("attribution").children];
  divs.forEach((div, i) => {
    if (i == index) {
      div.classList.remove("d-none");
    } else {
      div.classList.add("d-none");
    }
  });
}

const svgNamespace = "http://www.w3.org/2000/svg";
const xlinkNamespace = "http://www.w3.org/1999/xlink";
const accessList = getAccessList(5);
let clickIndex = 0;
let segmentIndex = 1;
let currPathIndex = 0;
let svg;
let problem;
let fontSize;
let iconList = [];

selectRandomCourse();
nextProblem();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("lang").onchange = changeLang;
document.getElementById("startButton").onclick = nextProblem;
courseNode.onclick = changeCourse;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
