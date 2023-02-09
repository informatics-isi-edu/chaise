import '@isrd-isi-edu/chaise/src/assets/scss/_markdown-container.scss';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import MarkdownPreviewModal from '@isrd-isi-edu/chaise/src/components/modals/markdown-preview-modal';

// hooks
import { useEffect, useState, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// utils
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import MarkdownCallbacks from '@isrd-isi-edu/chaise/src/utils/markdown-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type LongtextFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
  * placeholder text
  */
  placeholder?: string,
  /**
  * classes for styling the input element
  */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
  /**
  * classes for styling the clear button
  */
  clearClasses?: string
  /**
  * flag for disabling the input
  */
  disableInput?: boolean,
  /**
  * flag to show error below the input switch component
  */
  displayErrors?: boolean,
  value: string,
  styles?: any,
  /**
  * the handler function called on input change
  */
  onFieldChange?: ((value: string) => void)
};

const LongtextField = ({
  name,
  placeholder,
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
}: LongtextFieldProps): JSX.Element => {

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showModalPreview, setShowModalPreview] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  // react-hook-form setup
  const { setValue, control, clearErrors } = useFormContext();
  const formInput = useController({
    name,
    control,
    rules: { required: false }
  });

  const field = formInput?.field;
  const fieldValue = field?.value;
  const [showClear, setShowClear] = useState<boolean>(Boolean(fieldValue));

  const fieldState = formInput?.fieldState;
  const { error, isTouched } = fieldState;

  // hooks
  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }

    if (showClear != Boolean(fieldValue)) {
      setShowClear(Boolean(fieldValue));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  // callback functions
  const handleChange = (v: any) => {
    field.onChange(v);
    field.onBlur();
  };

  const clearInput = () => {
    setValue(name, '');
    clearErrors(name);
  }

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

  return (
    <div className={`${containerClasses} input-switch-container-${makeSafeIdAttr(name)} input-switch-longtext-container`} style={styles}>
      <div className='md-editor'>
        <div className='md-header chaise-btn-toolbar'>
          <div className='chaise-btn-group'>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Heading' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setHeading(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-header'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Bold' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setBold(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-bold'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Italic' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setItalic(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-italic'></span>
            </button>
          </div>
          <div className='chaise-btn-group'>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='URL/Link' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setLink(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-link'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Image' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setImage(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa-regular fa-image'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn chaise-btn-no-padding'
              type='button' title='RID link' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setRidLink(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='chaise-icon chaise-RID'></span>
            </button>
          </div>
          <div className='chaise-btn-group'>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Unordered List' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setList(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-list'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Ordered List' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setListOrdered(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-list-ol'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Quote' disabled={showPreview}
              onClick={() => {
                  MarkdownCallbacks.setQuote(textAreaRef.current);
                  setValue(name, textAreaRef.current?.value);
                }
              }
            >
              <span className='fa fa-quote-left'></span>
            </button>
          </div>
          <div className='chaise-btn-group'>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Help' disabled={showPreview}
              onClick={MarkdownCallbacks.openHelp}
            >
              <span className='fa-solid fa-circle-question'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Preview'
              onClick={togglePreview}
            >
              <span className='fa-solid fa-eye'></span>
            </button>
            <button className='chaise-btn-secondary chaise-btn'
              type='button' title='Fullscreen Preview' disabled={showPreview}
              onClick={modalPreview}
            >
              <span className='fa-solid fa-expand'></span>
            </button>
          </div>
        </div>
        {!showPreview ?
          <div className={`chaise-input-control has-feedback content-box ${classes} ${disableInput ? ' input-disabled' : ''}`}>
            <textarea
              placeholder={placeholder} rows={5} className={`${inputClasses} input-switch`} {...field}
              onChange={handleChange} ref={textAreaRef} data-provide='markdown'
            />
            <ClearInputBtn
              btnClassName={`${clearClasses} input-switch-clear`}
              clickCallback={clearInput}
              show={showClear}
            />
          </div>
        : <div className='md-preview chaise-input-control' data-provide='markdown' style={{'height': textAreaRef.current?.offsetHeight}}>
            <div className='disabled-textarea markdown-container' dangerouslySetInnerHTML={{ __html: previewContent }}></div>
          </div>
        }
      </div>
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
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
  );
}

export default LongtextField;
