import React, { useState } from 'react';
import {IconContext} from "react-icons"
import { FaGooglePlus,FaFacebook } from "react-icons/fa";
import NewWindow from 'react-new-window'
import '../stylesheets/login.css'
var constants = require('../constants');

function Header(props){
    return(
        <div className="header">
            <h1>Turtle-Chat</h1>
        </div>
    )
}

function LoginLinks2(props){

    const [selected,setSelected] = useState(-1);

    if(props.disable === false && selected !== -1){
        setSelected(-1);
    }

    let iconsOnClick = (url,selected_one)=>{
        if(props.disable) return;
        props.setPopupUrl(url);
        setSelected(selected_one);
    }

    let isSelected = (current)=>{
        if(current === selected) return "selected-link";
        return " ";
    }
    
    return(
        <div className="login-icons-container">
            <div className = 'split-container'>
                <div className="login side">
                    <div className="side-text">LOGIN</div>
                    <div className={"google login-icons-wrapper-div " + isSelected(0)}
                    onClick={()=>iconsOnClick('/google-react/login',0)}>
                        <FaGooglePlus className="login-icons"/>
                    </div>
                    <div className={"facebook login-icons-wrapper-div " + isSelected(1)}
                    onClick={()=>iconsOnClick('/facebook-react/login',1)}>
                        <FaFacebook className="login-icons"/>
                    </div>
                </div>
                <div className="signup side">

                    <div className="side-text">SIGNUP</div>
                    <div className = {"google login-icons-wrapper-div " + isSelected(2)}
                    onClick={()=>iconsOnClick('/google-react/signup',2)}
                    >
                        <FaGooglePlus className="login-icons"/>
                    </div>
                    <div className = {"facebook login-icons-wrapper-div " + isSelected(3)}
                    onClick={()=>iconsOnClick('/facebook-react/signup',3)}
                    >
                        <FaFacebook className="login-icons"/>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginLinks(props){
    return(
        <div className="loginlinks">
            <IconContext.Provider value={{ className:"button-icons" }}>    
                <button onClick={()=>props.setPopupUrl('/google-react/login')}>Log in with google <FaGooglePlus/> </button>
                <br/>
                <button onClick={()=>props.setPopupUrl('/google-react/signup')}>Sign up with google <FaGooglePlus/> </button>
                <br/>
                <button onClick={()=>props.setPopupUrl('/facebook-react/login')}>Log in with facebook <FaFacebook/> </button>
                <br/>
                <button onClick={()=>props.setPopupUrl('/facebook-react/signup')}>Sign up with facebook <FaFacebook/> </button>
            </IconContext.Provider>
        </div>
    )
}


function UserAccess(){
    return(
        <div className="centertext">
            <h1>User Access in process</h1>
        </div>
    )
}

function PopupBlocked(){
    return(
        <div className="centertext">
            <h1>Login/signup pop up is blocked</h1>
        </div>
    )
}

class Login extends React.Component{
    constructor(props){
        super(props);
        this.state = {openPopup : false,popupBlocked : false,popupUrl : ''};
        this.openPopup = this.openPopup.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.setPopupUrl = this.setPopupUrl.bind(this);
    }

    openPopup(){
        this.setState({openPopup : true})
    }

    setPopupUrl(u){
        this.setState({popupUrl:u,openPopup:true})
    }

    closePopup(){
        this.setState({openPopup : false});
        fetch(constants.url+'/users',{method:"get",mode:"cors",credentials:"include",cache:'default'})
        .then(resp=>{
            if(resp.status === 200) this.props.setLogStatus("logged");
        })
        .catch(err=>{
            this.props.setErrorMessage(err.message);
            this.props.setLogStatus("error");
        })
    }

    popupBlocked(){
        this.setState({popupBlocked : true})
    }

    render(){

        return(
            <div className="root-container">
                <Header />
                {this.state.popupBlocked ? <PopupBlocked/> : null }
                <LoginLinks2 setPopupUrl={this.setPopupUrl} disable={this.state.openPopup}/>
                {this.state.openPopup ? <NewWindow url={constants.url+this.state.popupUrl} onBlock={this.state.popupBlocked} onUnload={this.closePopup}/> : null}
            </div>
        )
    }
}

export default Login;