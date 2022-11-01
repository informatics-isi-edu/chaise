import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import Columns from '@isrd-isi-edu/chaise/src/components/recordedit/columns';
import FormContainer from '@isrd-isi-edu/chaise/src/components/recordedit/form-container';
import {fireCustomEvent} from '@isrd-isi-edu/chaise/src/utils/ui-utils';


export type RecordeditProps = {
  reference: any
}

const Recordedit = (props: RecordeditProps) : JSX.Element => {

  const { reference } = props;

  // (reference.columns||[]).map(v => {
  //   console.log(v.type);
  // })
  console.log('record edit props:: ', props.reference.columns);

  const addForm = () => fireCustomEvent('add-form', '.form-container');

  return (
    <div className='record-edit-main'>
      <div className='record-edit-header'>
        Recordedit of <DisplayValue value={reference.displayname} />
        <button className='form-add-btn' onClick={addForm}> ADD</button>
      </div>
      
      <div className='record-edit-container'>
        <Columns columns={reference.columns}/>
        <FormContainer columns={reference.columns}/>
      </div>
    </div>
  );
}

export default Recordedit;
