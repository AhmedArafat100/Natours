import {showAlert} from "./alert"
import axios from "axios";

export const updateSettings = async (data,type)=>{
    try {
        const url =
        type === 'password'
          ? '/api/v1/users/updateMypasword'
          : '/api/v1/users/updateMe';

          const res = await axios({
            method: 'PATCH',
            url,
            data
          });

          if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
          }
        
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}