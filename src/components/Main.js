import React from 'react';
import Chat from './Chat';
import Login from './Login';
var constants = require('../constants');

function Checking(props){
    return(
        <h1 className="centertext">Checking User Credentials</h1>
    )
}
function ShowError(props){
    return(
        <div className="error-message-container">
            <h1> {props.errorMessage} </h1>
        </div>
    )
}


class Main extends React.Component{
    constructor(props){
        super(props);
        this.state = {logged : "checking",errorMessage : ""};
        this.setLogStatus = this.setLogStatus.bind(this);
        this.setErrorMessage = this.setErrorMessage.bind(this);
    }

    setLogStatus(status){
        this.setState({logged : status});
    }

    setErrorMessage(message){
        this.setState({
            errorMessage : message
        })
    }

    componentDidMount(){
        fetch(constants.url + '/users',{
            method : "get",credentials : 'include',mode : "cors",cache : "default"
        }).then(resp => {
            if(resp.status === 401){
                this.setState({logged : "notLogged"})
            }
            else if(resp.status === 200){
                this.setState({logged : "logged"})
            }
            else{
                this.setState({
                    logged : "error",
                    errorMessage : resp.statusText
                })
            }
        })
        .catch(err => {
            this.setState({logged : "error",errorMessage : err.message})
        });
    }

    

    render(){
        switch(this.state.logged){
            case "checking":
                return <Checking />
            case "error":
                return <ShowError errorMessage = {this.state.errorMessage}/>
            case "notLogged":
                return <Login setErrorMessage = {this.setErrorMessage} setLogStatus={this.setLogStatus}/>
            case "logged":
                return <Chat setErrorMessage = {this.setErrorMessage} setLogStatus={this.setLogStatus} />
            
            default:
                return <h1>Refresh</h1>
        }
    }
}

export default Main;