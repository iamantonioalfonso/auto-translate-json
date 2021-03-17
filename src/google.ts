const { Translate } = require("@google-cloud/translate").v2;
export class GoogleTranslate {
  apikey: string;
  googleTranslate: any;

  constructor(apikey: string) {
    this.apikey = apikey;
    this.googleTranslate = new Translate({ key: this.apikey });
  }

  async isValidLocale(targetLocale: string): Promise<boolean> {
    try {
      await this.googleTranslate.translate("test", targetLocale);
    } catch (error) {
      if (error.message === "Invalid Value") {
        return false;
      }
      throw error;
    }

    return true;
  }

  async translateText(text: string, targetLocale: string): Promise<string> {
    const pattern = /{(.*?)}/g;
    const args = text.match(pattern);

    // replace arguments with numbers
    if (args) {
      let i = 0;
      for (let arg of args) {
        text = text.replace(arg, "{" + i + "}");
        i++;
      }
    }

    let result = "";

    try {
      const translations = await this.googleTranslate.translate(
        text,
        targetLocale
      );
      result = translations[0];
    } catch (error) {
      let message = error.message;
      if (error.message === "Invalid Value") {
        message = "Invalid Locale " + targetLocale;
      }
      console.log(message);
      return "";
    }

    // replace arguments with numbers
    if (args) {
      let i = 0;
      for (let arg of args) {
        result = result.replace("{" + i + "}", arg);
        i++;
      }
    }

    return result;
  }
}
