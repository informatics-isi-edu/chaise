import '@isrd-isi-edu/chaise/src/assets/scss/_recordedit.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

export type RecordeditProps = {
  reference: any
}

const Recordedit = ({
  reference
}: RecordeditProps) : JSX.Element => {

  // TODO

  return (
    <>
      Recordedit of <DisplayValue value={reference.displayname} />
    </>
  );
}

export default Recordedit;
