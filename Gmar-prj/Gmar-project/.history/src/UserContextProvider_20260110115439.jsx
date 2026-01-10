import React, { useContext } from 'react';
import { createContext, useState } from "react";
import { v4 as uuidv4 } from 'uuid';


export const UserContext = createContext();



export default function UserContextProvider(props) {

const [useritems,setItems] = useState([]);

const addUserItem = (username,email,password) => {
    let newitem = {
        id: uuidv4(),
        username: username,
        email: email,
        password: password
    }
    setItems([...useritems,newitem])
}

const deleteUserItem = (id) => { 
    setItems(useritems.filter(item => item.id !== id))
}

  return (
    <UserContext.Provider value={{useritems,addUserItem,deleteUserItem}}>
      {props.children}
    </UserContext.Provider>
  )
}
