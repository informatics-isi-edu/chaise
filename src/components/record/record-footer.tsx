import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

/**
 * Returns Footer Section of the record page.
 */
const RecordFooter = (): JSX.Element => {
  return (
    <div className='footer-container'>
      <p>
        <a href='/privacy-policy' target="'_blank'">
          * Privacy policy
        </a>
      </p>
    </div>
  );
};

export default RecordFooter;
