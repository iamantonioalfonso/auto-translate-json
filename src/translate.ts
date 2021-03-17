import * as minimist from 'minimist';
import { Files } from "./files";
import { GoogleTranslate } from "./google";

let parsedArgs;
const NAME = "Translate";

export async function translate(argv: string[]) {
  parsedArgs = minimist(argv.slice(2));
  const [ apikey ] = parsedArgs._;

  // check that we have a google api key
  if (!apikey) {
    showWarning("You must provide a Google API key first in the extension settings.");
    return;
  }

  let googleTranslate = new GoogleTranslate(apikey);
  const files = new Files(parsedArgs.path || './');

  try {
    // log locale info
    showMessage("Source locale = " + files.sourceLocale);
    showMessage("Target locales = " + files.targetLocales);
  } catch (error) {
    showError(error, "Opening Files: ");
    return;
  }

  // ask user to pick options
  let keepTranslations = await askToPreservevTranslations();
  if (keepTranslations === null) {
    showWarning("You must select a translations option");
    return;
  }
  let keepExtras = await askToKeepExtra();
  if (keepExtras === null) {
    showWarning("You must select a keep option");
    return;
  }

  // load source JSON
  try {
    let source = await files.loadJsonFromLocale(files.sourceLocale);
    // Iterate target Locales
    files.targetLocales.map(async (targetLocale) => {
      try {
        let isValid = await googleTranslate.isValidLocale(targetLocale);

        if (!isValid) {
          throw Error(targetLocale + " is not supported. Skipping.");
        }

        let targetOriginal = await files.loadJsonFromLocale(targetLocale);

        // Iterate source terms
        let targetNew = await recurseNode(
          source,
          targetOriginal,
          keepTranslations,
          keepExtras,
          targetLocale,
          googleTranslate
        );

        // save target
        files.saveJsonToLocale(targetLocale, targetNew);

        let feedback = "Translated locale '" + targetLocale + "'";
        showMessage(feedback);
      } catch (error) {
        showError(error.message);
        return;
      }
    }).forEach((promise) => promise.then());

  } catch (error) {
    showError(error, "Source file malfored");
    return;
  }
}

async function recurseNode(
  source: any,
  original: any,
  keepTranslations: boolean | null,
  keepExtras: boolean | null,
  locale: string,
  googleTranslate: GoogleTranslate
): Promise<any> {
  let destination: any = {};

  // defaults
  if (keepTranslations === null) {
    keepTranslations = true;
  }
  if (keepExtras === null) {
    keepExtras = true;
  }

  for (let term in source) {
    let node = source[term];

    if (node instanceof Object && node !== null) {
      destination[term] = await recurseNode(
        node,
        original[term] ?? {},
        keepTranslations,
        keepExtras,
        locale,
        googleTranslate
      );
    } else {
      // if we already have a translation, keep it
      if (keepTranslations && original[term]) {
        destination[term] = original[term];
      } else {
        destination[term] = await googleTranslate
          .translateText(node, locale)
          .catch((err) => showError(err));
      }
    }
    // console.log(destination[term]);
  }

  if (keepExtras) {
    // add back in any terms that were not in source
    for (let term in original) {
      if (!destination[term]) {
        destination[term] = original[term];
      }
    }
  }

  return destination;
}

function showError(error: Error, prefix: string = "") {
  let message = error.toString();
  if (error.message) {
    message = NAME + ": " + prefix + error.message;
  } else {
    message = NAME + ": " + prefix + message;
  }
  console.error(message);
}

function showWarning(message: string, prefix: string = "") {
  message = NAME + ": " + prefix + message;
  console.log(message);
}

function showMessage(message: string, prefix: string = "") {
  message = NAME + ": " + prefix + message;
  console.log(message);
}

async function askToPreservevTranslations(): Promise<boolean | null> {
  const keepTranslations: boolean | null = null;
  const optionKeep = "Preserve previous translations (default)";
  const optionReplace = "Retranslate previous translations";
  return parsedArgs.preserve;
}

async function askToKeepExtra(): Promise<boolean | null> {
  const keepExtra: boolean | null = null;
  const optionKeep = "Keep extra translations (default)";
  const optionReplace = "Remove extra translations";
  return parsedArgs.keep;
}
