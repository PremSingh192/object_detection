import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
//import { Button, Card, Container, Row, Col } from "react-bootstrap";
import "../assets/images/App.css";
import * as tf from "@tensorflow/tfjs";
import axios from "axios";
import Webcam from "react-webcam";
// import modelPath from "./model.json";
// import weightPath from "./weights.bin";
export default function Home() {
  const navigate = useNavigate();
  const [mymodel, setMyModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const intervalIdRef = useRef(null);
  const [modelpredictions, setmodelpredictions] = useState({
    without_helmet: 0,
    with_helmet: 0,
  });

  // setInterval(()=>{
  // capture()
  // },1500)
  // const [myimage, setmyimage] = useState("");
  // const sendImageToBackend = async (imageSrc) => {
  //   const accesslocal = localStorage.getItem("access_token") || "";

  //   // const formData = new FormData();
  //   // formData.append("image", myimage);
  //   // for (const pair of formData.entries()) {
  //   //   console.log(`${pair[0]}: ${pair[1]}`);
  //   // }
  //   const apiUrl = "http://localhost:8000/api/upload";
  //   const options = {
  //     headers: {
  //       Authorization: `Bearer ${accesslocal}`,
  //       "Content-Type": "application/json",
  //     },
  //   };
  //   const body = {
  //     image: imageSrc,
  //   };
  //   axios
  //     .post(apiUrl, body, options)
  //     .then((response) => {
  //       console.log(` from the upload response  ${JSON.stringify(response.data)}`);
  //     })
  //     .catch((err) => {
  //       console.log(`error from upload response catch ${JSON.stringify(err.response.data)}`);
  //     });
  // };

  useEffect(() => {
    const access = localStorage.getItem("access_token") || "";

    if (!access == "") {
      const apiUrl = "http://localhost:8000/api/user/isAuth";
      const send = {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
      };

      axios
        .post(apiUrl, {}, send)
        .then((response) => {
          console.log(` from the .then  ${response.data.message}`);
        })
        .catch((err) => {
          console.log(`error from catch ${err.response.data.message}`);
          navigate("/Login");
        });
    } else {
      console.log(`no token in localstorage`);
      navigate("/Login");
    }

    const loadModel = async () => {
      try {
        const model = await tf.loadLayersModel("/model/model.json");

        setMyModel((prev) => ({ ...prev, model }));
        return model;
      } catch (error) {
        console.log("Error loading model: " + error.message);
      }
    };

    loadModel()
      .then((model) => {
        console.log("Model loaded successfully: ");
      })
      .catch((err) => {
        console.error("Error from load model: ", err);
      });
  }, []);

  const webcamRef = useRef(null);
  const startProcessing = () => {
    // Set a time interval for making predictions
    intervalIdRef.current = setInterval(() => {
      if (mymodel) {
        capture();
      }
    }, 2000); // Adjust the interval time as needed

    setIsProcessing(true);
    setShowStartButton(false);
  };

  const stopProcessing = () => {
    // Clear the time interval when the "Stop" button is clicked
    clearInterval(intervalIdRef.current);

    setIsProcessing(false);
    setShowStartButton(true);
  };
  const capture = () => {
    // console.log(myimage);

    const imageSrc = webcamRef.current.getScreenshot();
    // console.log("from capture", imageSrc.slice(0, 25));
    // sendImageToBackend(imageSrc);
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => predictImage(img);
    }
  };

  // console.log("out side useeffect ", mymodel)
  const predictImage = async (imageElement) => {
    try {
      // Check if the model is loaded
      if (!mymodel) {
        console.error("Model is not loaded.");
        return;
      }

      // Log the current state of mymodel
      // console.log("mymodel state", mymodel);

      // Convert image to a TensorFlow tensor
      const tensor = tf.browser.fromPixels(imageElement);
      const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]);
      // Preprocess the tensor (expand dimensions to match model input shape)
      const preprocessed = resizedTensor.expandDims(0);

      // Make predictions
      const predictions = await mymodel.model.predict(preprocessed).data();
      setmodelpredictions({
        without_helmet: predictions[0],
        with_helmet: predictions[1],
      });
       console.log("predictions:", predictions);
      const predictedClassIndex = tf.argMax(predictions).dataSync()[0];
      // Display or handle predictions as needed
      console.log("Predicted Class Index:", predictedClassIndex);

      // Cleanup
      tensor.dispose();
      resizedTensor.dispose();
    } catch (error) {
      console.error("Error during prediction:", error);
    }
  };

  // function callcapture() {
  //   if (timer) {
  //     setInterval(() => {
  //       capture();
  //     }, 2000);

  //   } else {

  //     console.log("timer ended");
  //   }

  //   callcapture();
  // }

  return (
    <div className="outer">
      <div className="innerbox">
        <div className="inner_video">
          <Webcam
            audio={false}
            height={480}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={720}
          />
        </div>
        <div className="innerbox2">
          {/* {    <div>
            <input
              type="file"
              onChange={(e) => {
                setmyimage(e.target.files[0]);
              }}
            />
          </div>} */}
         
          {showStartButton &&(<button
              className="button1"
              onClick={startProcessing}
              disabled={isProcessing}
            >
              Start
            </button>)}  

         { !showStartButton && (  <button
              className="button1"
              onClick={stopProcessing}
              disabled={!isProcessing}
            >
              Stop
            </button>)}
     

          <div className="innerbox2text">
            <span className="innertext">
              without helmet:{modelpredictions.without_helmet.toFixed(2)}{" "}
            </span>
            <span className="innertext">
              with helmet:{modelpredictions.with_helmet.toFixed(2)}{" "}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
