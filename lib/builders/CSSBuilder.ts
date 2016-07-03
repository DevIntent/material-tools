import {MaterialToolsData, MaterialToolsOutput} from '../MaterialTools';

const cleanCSS = require('clean-css');
const fse = require('fs-extra');
const formatCSS = require('cssbeautify');
const sass = require('node-sass');

export class CSSBuilder {

  /**
   * Generates minified and non-minified version of the CSS, based on the specified build data.
   */
  static build(data: MaterialToolsData): { noLayout: MaterialToolsOutput, layout: MaterialToolsOutput } {
    // Compiled core.css without the layout.
    let coreNoLayout = this._compileSCSS(
      this._loadStyles(
        data.files.scss
          .sort(path => (path.indexOf('variables.scss') > -1 || path.indexOf('mixins.scss') > -1) ? -1 : 1)
          .filter(path => path.indexOf('core') > -1)
      )
    );

    // CSS for the components, without any layouts or structure.
    let componentCSS = this._loadStyles(
      data.files.css.filter(path => path.indexOf('core.css') === -1)
    );

    return {
      noLayout: this._buildStylesheet(coreNoLayout + componentCSS),
      layout: this._buildStylesheet(this._loadStyles(data.files.css))
    };
  }

  /**
   * Generates a minified and non-minified version of the specified stylesheet.
   */
  static _buildStylesheet(styleSheet: string): MaterialToolsOutput {
    let compressed = new cleanCSS({
      // Strip the licensing info from the original file. It'll be re-added by the MaterialTools.
      keepSpecialComments: 0
    }).minify(styleSheet);

    return {
      source: this._beautifyStylesheet(styleSheet),
      compressed: compressed.styles
    }
  }

  /**
   * Beautifies the specified CSS stylesheet.
   */
  private static _beautifyStylesheet(styleSheet: string): string {
    return formatCSS(styleSheet, {
      indent: '  ',
      autosemicolon: true
    });
  }

  /**
   * Reads and concatenates CSS files.
   */
  static _loadStyles(files: string[]): string {
    return files.map(path => fse.readFileSync(path).toString()).join('\n');
  }

  /**
   * Compiles SCSS to CSS.
   */
  static _compileSCSS(styles: string): string {
    return sass.renderSync({
      data: styles,
      outputStyle: 'compressed'
    }).css.toString();
  }
}