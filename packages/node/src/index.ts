import { readFile } from "fs/promises";
import * as cheerio from "cheerio";
import { decode } from "entities";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);
import uniq from "lodash/uniq.js";

const usedIds = new Set();

const regexValidatorStyleValueTupleDynamicPart = /^@[a-z]+=[a-z]+$/;

let attempts = 0;
function generateId() {
  const id = nanoid();
  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  } else {
    if (attempts > 10)
      throw new Error("Too many attempts to generate unique ID");
    attempts++;
    return generateId();
  }
}

const html = await readFile("implemented.html", "utf8");
const $ = cheerio.load(html, { xml: true });

const root = $.root();

root.children().each((i, el) => {
  loop(el);
});

function loop(el) {
  if (el.attributes?.length) {
    parseAttributes(el.attributes, el);
  }
  if (el.children) {
    el.children.forEach((child) => loop(child));
  }
}

function parseAttributes(attributes, el) {
  attributes.forEach((attr) => {
    switch (attr.name) {
      case "stylex":
        const parsedValue = validateAttribute(attr.name, attr.value);
        $(el).removeAttr(attr.name);
        const id = generateId();
        el.stylexId = id;
        $(el).attr("data-stylex-id", id);
        const cssString = generateCssStringRulesets(parsedValue, id, el);
        $(el).append(`<style data-sx-id="${id}">${cssString}</style>`);
    }
  });
}

function validateAttribute(name, value) {
  switch (name) {
    case "stylex":
      return validateStyleXAttribute(name, value);
    default:
      return false;
  }
}

function validateStyleXAttribute(name, value) {
  try {
    const result = JSON.parse(value);
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error(`Invalid stylex attribute: value`);
    }
    validateStyleXValue(result);
    return result;
  } catch (e) {
    throw new Error(`Couldn't parse stylex attribute: ${e.message}`);
  }
}

function validateStyleXValue(value) {
  const isValid = Object.values(value).every((propertyValue) =>
    validateStyleXPropertyValue(propertyValue)
  );
  if (!isValid) {
    throw new Error("StyleX value is not valid");
  }
}

function validateStyleXPropertyValue(value) {
  if (valueIsString(value)) {
    return true;
  } else if (Array.isArray(value) && value.length) {
    value = uniq(value);
    const first = value.splice(0, 1)[0];
    const middle = value;
    const last = value.splice(-1, 1)[0];

    if (middle.length) {
      const allValid = middle.every((v) => valueIsTuple(v));
      if (!allValid) {
        throw new Error("Property middle values can only be tuples");
      }
    }

    if (!valueIsString(last) && !valueIsTuple(last)) {
      throw new Error("Property last value must be a string or tuple");
    }

    if (!valueIsString(first) && !valueIsTuple(first)) {
      throw new Error("Property fist value must be a string or tuple");
    }

    if (valueIsString(first) && valueIsString(last)) {
      throw new Error("If first value is string, last value must be tuple");
    }

    return true;
  }
  throw new Error(`Invalid property value: ${value}`);
}

function valueIsString(value) {
  return typeof value === "string";
}

function valueIsTuple(value) {
  if (Array.isArray(value) && value.length === 2) {
    if (valueIsString(value[0]) && valueIsString(value[1])) {
      validateStyleXTupleValue(value[0]);
      return true;
    }
  }

  return false;
}

function validateStyleXTupleValue(value) {
  switch (true) {
    case value === "@hover":
      return true;
    case value === ">@hover":
      return true;
    case regexValidatorStyleValueTupleDynamicPart.test(value):
      return true;
  }
  throw new Error(`Invalid StyleX tuple value: ${value}`);
}

function generateCssStringRulesets(value, id, el) {
  const rulesets = [];
  Object.entries(value).forEach((entry) => {
    const [name, value] = entry;
    const add = generateSingleDeclarationCssRuleset([name, value], id, el);
    if (add) {
      rulesets.push(...add);
    }
  });
  return rulesets
    .map(([selector, [name, value]]) => {
      return `${selector} { ${name}: ${value}; }`;
    })
    .join("\n");
}

function generateSingleDeclarationCssRuleset([name, value], id, el) {
  if (valueIsString(value)) {
    return [[`[data-stylex-id="${id}"]`, [name, value]]];
  } else {
    const rulesets = [];
    value.forEach((valuee) => {
      if (valueIsString(valuee)) {
        rulesets.push([`[data-stylex-id="${id}"]`, [name, valuee]]);
      } else {
        switch (true) {
          case valuee[0] === "@hover":
            rulesets.push([
              `[data-stylex-id="${id}"]:hover`,
              [name, valuee[1]],
            ]);
            break;
          case valuee[0] === ">@hover":
            {
            const parentId = el.parent?.stylexId;
            rulesets.push([
              `[data-stylex-id="${parentId}"]:hover > [data-stylex-id="${id}"]`,
              [name, valuee[1]],
            ]);
            }
            break;
          case regexValidatorStyleValueTupleDynamicPart.test(valuee[0]):
            console.log("case matched: ", valuee[0])
            {
              const [stateName, stateValue] = splitStyleValueTupleDynamicPart(valuee[0])
              rulesets.push([
                `[data-stylex-id="${id}"][data-stylex-state-${stateName}="${stateValue}"]`,
                [name, valuee[1]],
              ]);
            }
            break;
        }
      }
    });
    return rulesets;
  }
}

function splitStyleValueTupleDynamicPart(value) {
  value = value.slice(1);
  console.log("Splitting dynamic part:", value);
  const [stateName, stateValue] = value.split("=");

  if (!stateName || !stateValue) {
    throw new Error(`Invalid StyleX tuple dynamic part value: ${value}, must be in format @name=value`);
  }

  return [stateName, stateValue];
}

console.log("Out:");
console.log(decode($.html()));
