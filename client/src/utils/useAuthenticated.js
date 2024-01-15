import React, { useEffect, useState } from "react";
import axios from "axios";
function useAuthenticated() {
  // const access = localStorage.getItem("access_token") || "";

  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        console.log("from use auth" + token);
        if (!token) {
          setAuth(false);
          console.log("Bearer token not found in localStorage");
        } else {
          const apiUrl = "http://localhost:8000/api/user/isAuth";
          const send = {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          };

          const response = await axios.post(apiUrl, {}, send);
         
          if (response.data.message) {
            console.log(`from inside ${response.data.message}`)
            setAuth(true);
            console.log("value of auth "+auth);
          } else {
            setAuth(false);
          }
        }
      } catch (error) {
        console.log(error.message || "Error fetching data");
      } finally {
        console.log("In the finally block");
        setAuth(true);
      }
    };

    fetchData();
  }, []);

  return auth ;
}

export default useAuthenticated;

