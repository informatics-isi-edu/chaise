import '@isrd-isi-edu/chaise/src/assets/scss/_md-help-app.scss';

import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

// utilities
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';


const mdHelpSettings = {
  appName: 'mdHelp',
  appTitle: 'Markdown Help',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,    // links in navbar might need this
  overrideExternalLinkBehavior: true      // links in navbar might need this
};

const MarkdownHelpApp = (): JSX.Element => {

  return (
    <div className='app-container container-fluid row'>
      <div className='main-container' id='main-content'>
        <div className='twelve columns center main-body'>
          <table className='markdown-reference' id='mainTable'>
            <thead className='hdrStyle'>
              <tr>
                <th>Raw</th>
                <th>Raw (Alternative)</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='rawInput' id='rBold1'>**Something Bold**</td>
                <td className='rawInput' id='rBold2'>__Something Bold__</td>
                <td id='oBold' className='markdown-container'><strong>Something Bold</strong></td>
              </tr>
              <tr>
                <td className='rawInput' id='rItalic1'>*Some Italic*</td>
                <td className='rawInput' id='rItalic2'>_Some Italic_</td>
                <td id='oItalic' className='markdown-container'><em>Some Italic</em></td>
              </tr>
              <tr>
                <td className='rawInput' id='rStrike1'>~~strikethrough text~~</td>
                <td className='rawInput' id='rStrike2'></td>
                <td 
                  id='oStrike' 
                  className='markdown-container' 
                  style={{textDecorationLine: 'line-through', textDecorationStyle: 'solid'}}
                >strikethrough text</td>
              </tr>
              <tr>
                <td className='rawInput' id='rSuperscript1'>^superscript^ text</td>
                <td className='rawInput' id='rSuperscript2'></td>
                <td id='oStrike' className='markdown-container'><sup>superscript</sup> text</td>
              </tr>
              <tr>
                <td className='rawInput' id='rSubscript1'>~subscript~ text</td>
                <td className='rawInput' id='rSubscript2'></td>
                <td id='oStrike' className='markdown-container'><sub>subscript</sub> text</td>
              </tr>
              <tr>
                <td className='rawInput' id='rLargeHdr1'>
                  # Large Heading
                </td>
                <td className='rawInput' id='rLargeHdr2'>
                  Large Heading<br /> =========
                </td>
                <td id='oLargeHdr' className='markdown-container'>
                  <h1 className='smaller-h1'>Large Heading</h1>
                </td>
              </tr>
              <tr>
                <td className='rawInput' id='rSmallHdr1'>
                  ## Heading
                </td>
                <td className='rawInput' id='rSmallHdr2'>
                  Heading<br /> ---------
                </td>
                <td id='oSmallHdr' className='markdown-container'>
                  <h2 className='smaller-h2'>Heading</h2>
                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  [Link](http://usc.edu)
                </td>
                <td className='rawInput '>
                  [Link][1]<br /> ⋮
                  <br /> [1]: http://usc.edu
                </td>
                <td className='markdown-container'><a href='#' target='_blank'>Link</a></td>
              </tr>
              <tr>
                <td className='rawInput' id='rRidLink1'>
                  [[RID]]
                </td>
                <td className='rawInput' id='rRidLink2'>
                  [RID](http://xyz/id/RID)
                </td>
                <td className='markdown-container' id='oRidLink'><a href='/id/RID' target='_blank'>RID</a></td>
              </tr>
              <tr>
                <td className='rawInput'>
                  ![Image](http://xyz/a.png)
                </td>
                <td className='rawInput '>
                  ![Image][1]<br /> ⋮
                  <br /> [1]: http://xyz/a.png
                </td>
                <td className='markdown-container'>
                  <img src='../images/USC-Shield.png' height='50' alt='Markdown' />
                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  &gt; This is<br /> blockquote

                </td>
                <td className='rawInput '>
                  &nbsp;
                </td>
                <td className='markdown-container'>
                  <blockquote>
                    <p>This is<br /> blockquote</p>
                  </blockquote>

                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  `Inline code` is very useful
                </td>
                <td className='rawInput'>
                  &nbsp;
                </td>
                <td className='markdown-container'>
                  <code className='rawInput'>Inline code</code> is very useful
                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  <p>
                    * List Item 1<br /> * List Item 2<br /> * List Item 3
                  </p>
                </td>
                <td className='rawInput'>
                  <p>
                    - List Item 1<br /> - List Item 2<br /> - List Item 3<br />
                  </p>
                </td>
                <td className='markdown-container'>
                  <ul>
                    <li>List Item 1</li>
                    <li>List Item 2</li>
                    <li>List Item 3</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  <p>
                    1. One<br /> 2. Two<br /> 3. Three
                  </p>
                </td>
                <td className='rawInput '>
                  <p>
                    1) One<br /> 2) Two<br /> 3) Three
                  </p>
                </td>
                <td className='markdown-container'>
                  <ol>
                    <li>One</li>
                    <li>Two</li>
                    <li>Three</li>
                  </ol>
                </td>
              </tr>
              <tr>
                <td className='rawInput'>
                  Horizontal Rule<br />
                  <br /> ---
                </td>
                <td className='rawInput'>
                  Horizontal Rule<br />
                  <br /> ***
                </td>
                <td className='markdown-container'>
                  Horizontal Rule
                  <hr className='custom-hr' />
                </td>
              </tr>

              <tr>
                <td className='rawInput'>
                  ```<br /> # neo eth<br /> {'log \'my name to\''}<br /> {'log \'ym mane ot\''}<br /> ```
                </td>
                <td className='rawInput '>
                  <span className='spaces'>····</span># neo eth<br />
                  <span className='spaces'>····</span>{'log \'my name to\''}<br />
                  <span className='spaces'>····</span>{'log \'ym mane ot\''}
                </td>
                <td className='markdown-container'>
                  <div className='code-block'>
                    # neo eth
                    <br /> {'log \'my name to\''}
                    <br /> {'log \'ym mane ot\''}
                  </div>
                </td>
              </tr>
              <tr>

                {/* Because there's nothing in the 2nd td, the first TD cannot have spaces in the HTML */}
                <td className='rawInput'>
                  <pre className='highlight-pre'>
                    <div>Header1 | Header2</div>
                    <div>------- | -------</div>
                    <div>Cell 1 | Cell 2</div>
                    <div>Cell 3 | Cell 4</div>
                  </pre>
                </td>
                <td></td>
                <td className='markdown-container'>
                  <table>
                    <thead>
                      <tr>
                        <th>Header1</th>
                        <th>Header2</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cell 1</td>
                        <td>Cell 2</td>
                      </tr>
                      <tr>
                        <td>Cell 3</td>
                        <td>Cell 4</td>
                      </tr>
                    </tbody>
                  </table>
                </td>

              </tr>

            </tbody>
            <tfoot>
              <tr className='more-details-row'>
                <td colSpan={3}>
                  For more advanced features please refer to <a 
                    target='_blank' 
                    href='https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/markdown-formatting.md' 
                    rel='noreferrer'
                  >this document</a>.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById(APP_ROOT_ID_NAME) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={mdHelpSettings}
    includeAlerts={false}
    includeNavbar={true}
  >
    <MarkdownHelpApp />
  </AppWrapper>
);