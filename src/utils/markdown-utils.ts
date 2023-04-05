// utilities
import { getHelpPageURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { HELP_PAGES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export default class MarkdownCallbacks {
/* 
 * Following functions taken from /common/vendor/MarkdownEditor/boostrap-markdown.js to 
 * mimic original markdown editor functionality from angularJS implementation 
 */
  static setHeading = (textArea: HTMLTextAreaElement | null) => {
    if (!textArea) return;
    // Append/remove ### surround the selection
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? 'heading text' : selectedText + '\n';

    let cursor, pointer, prevChar;
    // transform selection and set the cursor into chunked text
    if ((pointer = 4, content.substring(startIdx - pointer, startIdx) === '### ')
        || (pointer = 3, content.substring(startIdx - pointer, startIdx) === '###')) {
      // case with '### ' or '###' before selection
      // modify startIdx by pointer to replace '### ' or '###'
      textArea.setRangeText(chunk, startIdx-pointer, endIdx);

      // -pointer to startIdx to account for '### ' or '###' being removed
      cursor = startIdx - pointer;
    } else if (startIdx > 0 && (prevChar = content.substring(startIdx - 1, startIdx), !!prevChar && prevChar != '\n')) {
      textArea.setRangeText('\n\n### ' + chunk, startIdx, endIdx);

      // +6 to startIdx to account for '\n\n### ' being added
      cursor = startIdx + 6;
    } else {
      // case with Empty string before selection
      textArea.setRangeText('### ' + chunk, startIdx, endIdx);

      // +4 to startIdx to account for '### ' being added
      cursor = startIdx + 4;
    }

    // Set the cursor
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setBold = (textArea: HTMLTextAreaElement | null) => {
    if (!textArea) return;
    // Set/remove '**' surrounding the selection
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? 'strong text' : selectedText;

    let cursor;
    // if '**' is present at beginning and end, remove it
    if (content.substring(startIdx - 2, startIdx) === '**' 
        && content.substring(endIdx, endIdx + 2) === '**') {
      textArea.setRangeText(chunk, startIdx - 2, endIdx + 2);
        
      // -2 to startIdx to account for '**' being removed
      cursor = startIdx - 2;
    } else {
      textArea.setRangeText('**' + chunk + '**', startIdx, endIdx);

      // +2 to startIdx to account for '**' being added
      cursor = startIdx + 2;
    }

    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setItalic = (textArea: HTMLTextAreaElement | null) => {
    // set/remove '_' surrounding the selection
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? 'emphasized text' : selectedText;
      
    let cursor;
    // if '_' is present at beginning and end, remove it
    if (content.substring(startIdx - 1, startIdx) === '_' 
        && content.substring(endIdx, endIdx + 1) === '_') {
      textArea.setRangeText(chunk, startIdx - 1, endIdx + 1);

      // -1 to startIdx to account for '_' being removed
      cursor = startIdx - 1;
    } else {
      textArea.setRangeText('_' + chunk + '_', startIdx, endIdx);

      // +1 to startIdx to account for '_' being added
      cursor = startIdx + 1;
    }

    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setLink = (textArea: HTMLTextAreaElement | null) => {
    // Set [] surrounding the selection and append the link
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? 'enter link description here' : selectedText;

    const link = prompt('Insert Hyperlink','http://');

    const urlRegex = new RegExp('^((http|https)://|(mailto:)|(//))[a-z0-9]', 'i');
    if (link !== null && link !== '' && link !== 'http://' && urlRegex.test(link)) {
      // create HTML element with link in the div then extract the text
      const dummy: HTMLDivElement = document.createElement('div');
      dummy.innerText = link;
    
      const sanitizedLink = dummy.innerText;

      // transform selection and set the cursor into chunked text
      textArea.setRangeText('[' + chunk + '](' + sanitizedLink + ')', startIdx, endIdx);

      // +1 to startIdx to account for '[' being added
      const cursor = startIdx + 1;

      // set selected text only
      textArea.focus();
      textArea.setSelectionRange(cursor, cursor + chunk.length);
    }
  }

  static setImage = (textArea: HTMLTextAreaElement | null) => {
    // Set ![] surrounding the selection and append the image link
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? 'enter image description here' : selectedText;

    const link = prompt('Insert Image Hyperlink','http://');

    const urlRegex = new RegExp('^((http|https)://|(//))[a-z0-9]', 'i');
    if (link !== null && link !== '' && link !== 'http://' && urlRegex.test(link)) {
      const dummy: HTMLDivElement = document.createElement('div');
      dummy.innerText = link;

      const sanitizedLink = dummy.innerText;

      // transform selection and set the cursor into chunked text
      textArea.setRangeText('![' + chunk + '](' + sanitizedLink + ' "enter image title here")', startIdx, endIdx);
      // +2 to startIdx to account for '![' being added
      const cursor = startIdx + 2;

      // set selected text only
      textArea.focus();
      textArea.setSelectionRange(cursor, cursor + chunk.length);
    }
  }

  static setRidLink = (textArea: HTMLTextAreaElement | null) => {
    // Set ![] surrounding the selection and append the image link
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx),
      // if no selected text, give sample text
      chunk = (selectedText.length === 0) ? '<RID>' : selectedText;

    let cursor;
    // transform selection and set the cursor into chunked text
    if (content.substring(startIdx - 2, startIdx) === '[[' 
        && content.substring(endIdx, endIdx + 2) === ']]') {
      textArea.setRangeText(chunk, startIdx - 2, endIdx + 2);

      // -2 to startIdx to account for '[[' being removed
      cursor = startIdx - 2;
    } else {
      textArea.setRangeText('[[' + chunk + ']]', startIdx, endIdx);

      // +2 to startIdx to account for '[[' being added
      cursor = startIdx + 2;
    }

    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setList = (textArea: HTMLTextAreaElement | null) => {
    // Prepend '- ' before the selection
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx);

    let chunk, cursor; 
    if (selectedText.length === 0) {
      // if no selected text, give sample text
      chunk = 'list text here';
      textArea.setRangeText('- ' + chunk, startIdx, endIdx);

      // +2 to startIdx to account for '- ' being added
      cursor = startIdx + 2;
    } else {
      if (selectedText.indexOf('\n') < 0) {
        chunk = selectedText;

        textArea.setRangeText('- ' + chunk, startIdx, endIdx);

        // +2 to startIdx to account for '- ' being added
        cursor = startIdx + 2;
      } else {
        let list: string[] = [];

        list = selectedText.split('\n');
        chunk = list[0];

        list.forEach((value, idx) => {
          list[idx] = '- ' + value;
        });

        textArea.setRangeText('\n\n' + list.join('\n'), startIdx, endIdx);

        // +4 to startIdx to account for '\n\n- ' being added
        cursor = startIdx + 4;
      }
    }
      
    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setListOrdered = (textArea: HTMLTextAreaElement | null) => {
    // Prepend '1. ' before the selection
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx);

    let chunk, cursor; 
    if (selectedText.length === 0) {
      // if no selected text, give sample text
      chunk = 'list text here';
      textArea.setRangeText('1. ' + chunk, startIdx, endIdx);

      // +3 to startIdx to account for '1. ' being added
      cursor = startIdx + 3;
    } else {
      if (selectedText.indexOf('\n') < 0) {
        chunk = selectedText;

        textArea.setRangeText('1. ' + chunk, startIdx, endIdx);

        // +3 to startIdx to account for '1. ' being added
        cursor = startIdx + 3;
      } else {
        let list: string[] = [];

        list = selectedText.split('\n');
        chunk = list[0];

        list.forEach((value, idx) => {
          list[idx] = (idx + 1) + '. ' + value;
        });

        textArea.setRangeText('\n\n' + list.join('\n'), startIdx, endIdx);

        // +5 to startIdx to account for '\n\n#. ' being added
        cursor = startIdx + 5;
      }
    }
      
    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static setQuote = (textArea: HTMLTextAreaElement | null) => {
    // Prepend '> ' before the selection
    if (!textArea) return;
    const content = textArea.value,
      startIdx = textArea.selectionStart,
      endIdx = textArea.selectionEnd,
      selectedText = content.substring(startIdx, endIdx);

    let chunk, cursor; 
    if (selectedText.length === 0) {
      // if no selected text, give sample text
      chunk = 'quote here';
      textArea.setRangeText('> ' + chunk, startIdx, endIdx);

      // +2 to startIdx to account for '> ' being added
      cursor = startIdx + 2;
    } else {
      if (selectedText.indexOf('\n') < 0) {
        chunk = selectedText;

        textArea.setRangeText('> ' + chunk, startIdx, endIdx);

        // +2 to startIdx to account for '> ' being added
        cursor = startIdx + 2;
      } else {
        let list: string[] = [];

        list = selectedText.split('\n');
        chunk = list[0];

        list.forEach((value, idx) => {
          list[idx] = '> ' + value;
        });

        textArea.setRangeText('\n\n' + list.join('\n'), startIdx, endIdx);

        // +4 to startIdx to account for '\n\n> ' being added
        cursor = startIdx + 4;
      }
    }
      
    // set selected text only
    textArea.focus();
    textArea.setSelectionRange(cursor, cursor + chunk.length);
  }

  static openHelp = () => windowRef.open(getHelpPageURL(HELP_PAGES.MARKDOWN_HELP), '_blank');
}
