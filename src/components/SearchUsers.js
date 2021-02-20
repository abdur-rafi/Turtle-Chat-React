import React from 'react'
import {FaFacebookMessenger} from 'react-icons/fa'
import {AiOutlineSearch} from 'react-icons/ai';
import '../stylesheets/searchusers.css'
var constants = require('../constants');

function Item(props){
    let onClick = () =>{
        let group = {
            group_id : "request"+props.user.user_id,
            group_name : null,
            group_user_name : props.user.username,
            image: props.user.image,
            name_user_id:props.user.user_id,
            last_time : Date.now(),
            unseenCount : 0
        }
        props.addRequestGroup(group);
    }
     return(
         <div className="user-item">
            <div className="user-item-image-container">
                <img src={"data:image/png;base64,"+props.user.image} />
            </div>
             <div><div>{props.user.username}</div> <div onClick={()=>onClick()} ><FaFacebookMessenger className="message-icon"/></div> </div>
         </div>
     )
}

class SearchUsers extends React.Component{
    constructor(props){
        super(props);
        this.state = {users : [],loadStatus : 'none'}
        this.changeState = this.changeState.bind(this);
    }

    changeState(users,loadStatus){
        this.setState({users : users,loadStatus : loadStatus})
    }

    render(){
        let t = this.state.users.map(user=><Item addRequestGroup={this.props.addRequestGroup} user={user} key={user.user_id} />)
        return(
        <div className="searchUsers">
            <UserSearchBar changeState={this.changeState} loadStatus={this.state.loadStatus}
                addNotification = {this.props.addNotification} clearNotificationType = {this.props.clearNotificationType}
            />
            
            {this.state.loadStatus === 'none' ? <h1></h1>: null }
            {this.state.loadStatus === 'loading' ? <h1>Fetching users</h1>: null }
            {this.state.loadStatus === 'completed' ? <div className="userList">{t}</div>: null }
            
        </div>
        )
    }
}

class UserSearchBar extends React.Component{
    constructor(props){
        super(props);
        this.state = {value : ''}
        this.changeValue = this.changeValue.bind(this);
        this.queryForUsers = this.queryForUsers.bind(this);
        this.sendOnEnter = this.sendOnEnter.bind(this);
    }

    changeValue(e){
        this.props.clearNotificationType("searchUsers");
        this.setState({value : e.target.value});
    }

    queryForUsers(){
        if(this.state.value.trim() === ''){
            let notification = {
                notification_id : ++constants.notification_id['count'],
                message : "Please enter some value first",
                type : "searchUsers"
            }
            this.props.addNotification(notification);
            return;
        }
        this.props.changeState([],'loading');
        fetch(constants.url+'/users/'+this.state.value,constants.getOptions).then(resp=>resp.json())
        .then(data=>this.props.changeState(data,'completed'));
        // this.setState({value : ''})
    }

    componentWillUnmount(){
        this.props.changeState([],'none');
    }

    sendOnEnter(e){
        if(e.code === "Enter"){
            e.preventDefault();
            this.queryForUsers();
        }
    }

    render(){
        return(
            <div className="userSearchBar">
                <input type="text" value={this.state.value} onChange={this.changeValue}
                 onKeyPress={this.sendOnEnter} disabled={this.props.loadStatus==='loading'}
                     placeholder="Insert Username"
                 />
                 <div className="enter-search-icon-container" onClick={()=>this.queryForUsers()}>
                     <AiOutlineSearch className="enter-search-icon" />
                 </div>
            </div>
        )
    }
    
}
export default SearchUsers;