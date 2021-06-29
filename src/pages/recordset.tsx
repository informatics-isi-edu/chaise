import React  from 'react'
import ReactDOM from 'react-dom'

const RecordSetApp: React.FC<{}> = (): JSX.Element => {
  return (
    <div>This is the recordset app</div>
  )
}

ReactDOM.render(
  <RecordSetApp/>,
  document.getElementById("chaise-app-root")
);
