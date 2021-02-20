export let url = window.env.DEVELOPMENT === 'TRUE' ? 'http://localhost:3000' : 'https://turtle-chat-server.herokuapp.com';
// if(window.env.PRODUCTION === 'TRUE'){
//     url = 'http://localhost:3000'
// }
export const getOptions = {method:"get",mode:"cors",credentials:"include",cache:"default"};
var head = new Headers();
head.append('Content-Type','application/json');
export const postOption = {method:"post",credentials:"include",mode:"cors",cache:"default",headers:head}
export let notification_id = {
    
};
