import '@isrd-isi-edu/chaise/src/assets/scss/_markdown-container.scss';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';
import MarkdownPreviewModal from '@isrd-isi-edu/chaise/src/components/modals/markdown-preview-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

// utils
import MarkdownCallbacks from '@isrd-isi-edu/chaise/src/utils/markdown-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { hasVerticalScrollbar } from '@isrd-isi-edu/chaise/src/utils/input-utils';
const LongTextField = (props: InputFieldProps): JSX.Element => {

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showModalPreview, setShowModalPreview] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  // react-hook-form setup
  const { setValue } = useFormContext();

  const togglePreview = () => {
    // Check the preview mode and toggle based on this flag
    if (!textAreaRef) return;

    if (showPreview) {
      // hide preview and remove preview text
      setPreviewContent('');
      setShowPreview(false);
    } else {
      setPreviewContent(windowRef.ERMrest.renderMarkdown(textAreaRef.current?.value));
      setShowPreview(true);
    }
  }

  const modalPreview = () => {
    setPreviewContent(windowRef.ERMrest.renderMarkdown(textAreaRef.current?.value));
    setShowModalPreview(true);
  }

  const name = props.name;

  const isMarkdown = props.type === 'markdown';

  return (
    <InputField {...props}>
      {(field, onChange, showClear, clearInput) => (
        <div className='input-switch-longtext'>
          <div className='md-editor'>
            {isMarkdown && <div className='md-header chaise-btn-toolbar'>
              <div className='chaise-btn-group'>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Heading' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setHeading(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-header'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Bold' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setBold(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-bold'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Italic' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setItalic(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-italic'></span>
                </button>
              </div>
              <div className='chaise-btn-group'>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='URL/Link' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setLink(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-link'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Image' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setImage(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa-regular fa-image'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn chaise-btn-no-padding'
                  type='button' title='RID link' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setRidLink(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='chaise-icon chaise-RID'></span>
                </button>
              </div>
              <div className='chaise-btn-group'>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Unordered List' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setList(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-list'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Ordered List' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setListOrdered(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-list-ol'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Quote' disabled={showPreview || props.disableInput}
                  onClick={() => {
                    MarkdownCallbacks.setQuote(textAreaRef.current);
                    setValue(name, textAreaRef.current?.value);
                  }}
                >
                  <span className='fa fa-quote-left'></span>
                </button>
              </div>
              <div className='chaise-btn-group'>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Help' disabled={showPreview || props.disableInput}
                  onClick={MarkdownCallbacks.openHelp}
                >
                  <span className='fa-solid fa-circle-question'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Preview' disabled={props.disableInput}
                  onClick={togglePreview}
                >
                  <span className='fa-solid fa-eye'></span>
                </button>
                <button className='chaise-btn-secondary chaise-btn'
                  type='button' title='Fullscreen Preview' disabled={showPreview || props.disableInput}
                  onClick={modalPreview}
                >
                  <span className='fa-solid fa-expand'></span>
                </button>
              </div>
            </div>}
            {!showPreview ?
              <div className={`chaise-input-control has-feedback content-box ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}>
                <textarea
                  placeholder={props.placeholder}
                  rows={5}
                  className={`${props.inputClasses} input-switch ${props.inputClassName} ${
                    hasVerticalScrollbar(textAreaRef.current) ? 'has-scrollbar' : ''
                  }`}
                  {...field}
                  disabled={props.disableInput}
                  onChange={onChange}
                  ref={textAreaRef}
                  data-provide='markdown'
                />
                <ClearInputBtn
                  btnClassName={`${props.clearClasses} input-switch-clear ${
                    hasVerticalScrollbar(textAreaRef.current) ? 'has-scrollbar-clear' : ''
                  }`}
                  clickCallback={clearInput}
                  show={showClear && !props.disableInput}
                />
              </div>
              : <div className='md-preview chaise-input-control' data-provide='markdown' style={{ 'height': textAreaRef.current?.offsetHeight }}>
                <div className='disabled-textarea'><DisplayValue addClass value={{value: previewContent, isHTML: true}} /></div>
              </div>
            }
          </div>
          {showModalPreview &&
            <MarkdownPreviewModal
              markdownContent={previewContent}
              onClose={() => {
                setShowModalPreview(false)
                setPreviewContent('')
              }
              }
            />
          }
        </div>
      )}
    </InputField>

  );
};

export default LongTextField;
