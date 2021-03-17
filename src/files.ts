import {dirname, basename} from "path";
import { readdirSync, readFile, writeFile} from "fs";

export class Files {
  folderPath: string;
  sourceLocale: string;
  targetLocales: Array<string>;

  constructor(filePath: string) {
    this.folderPath = dirname(filePath);
    this.sourceLocale = this.getLocaleFromFilename(basename(filePath));
    this.targetLocales = this.getTargetLocales();
  }

  private getLocaleFromFilename(fileName: string): string {
    return fileName.replace(".json", "");
  }

  private getTargetLocales(): string[] {
    const locales = [];
    const files = readdirSync(this.folderPath);

    files.forEach((file) => {
      const locale = this.getLocaleFromFilename(file);
      if (locale !== this.sourceLocale) {
        locales.push(locale);
      }
    });

    return locales;
  }

  async loadJsonFromLocale(locale: string): Promise<any> {
    const filename = this.folderPath + "/" + locale + ".json";
    let data = await this.readFileAsync(filename);

    // handle empty files
    if (!data) { data = "{}"; }

    return JSON.parse(data);
  }

  private async readFileAsync(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      readFile(filename, (error, data) => {
        error ? reject(error) : resolve(data.toString());
      });
    });
  }

  saveJsonToLocale(locale: string, file: any) {
    const filename = this.folderPath + "/" + locale + ".json";
    const data = JSON.stringify(file, null, "  ");

    writeFile(filename, data, { encoding: 'utf8' }, () => null);
  }
}
