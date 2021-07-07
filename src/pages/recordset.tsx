import React  from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux';
import { store } from 'Store/store';

const RecordSetApp: React.FC<{}> = (): JSX.Element => {
  return (
    <div>This is the recordset app</div>
  )
}

ReactDOM.render(
  <Provider store={store}>
    <RecordSetApp />
  </Provider>,
  document.getElementById("chaise-app-root")
);
