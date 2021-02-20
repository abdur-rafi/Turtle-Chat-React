
import Main from './components/Main'
import './stylesheets/App.css'
function App() {
  let url = 'https://turtle-chat-server.herokuapp.com';
  if(window.env.DEVELOPMENT === 'TRUE'){
    url = 'http://localhost:3000'
  }
  return (
    <div className="App">
      
      <Main url={url}/>
    </div>
  );
}

export default App;
