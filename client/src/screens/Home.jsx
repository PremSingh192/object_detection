import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
//import { Button, Card, Container, Row, Col } from "react-bootstrap";
import "../assets/images/App.css";
import * as tf from "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";
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
  const [webcam, setwebcam] = useState(null);
  const webcamRef = useRef(null);
  const [imgurl, setimgurl] = useState(null);
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
        const modelURL =
          "https://teachablemachine.withgoogle.com/models/hMM_hHyfL/model.json";
        const metadataURL =
          "https://teachablemachine.withgoogle.com/models/hMM_hHyfL/metadata.json";
        const model = await tmImage.load(modelURL, metadataURL);
        //  const model = await tmImage.load("/model/model.json");

        setMyModel(model);
        return model;
      } catch (error) {
        console.log("Error loading model: " + error);
      }
    };

    loadModel()
      .then((model) => {
        console.log("Model loaded successfully: ", model);
      })
      .catch((err) => {
        console.error("Error from load model: ", err);
      });

    capture()
      .then((data) => {
        console.log("web cam loaded", data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  const capture = async () => {
    const flip = true; // whether to flip the webcam

    // Initialize the webcam
    const webcamInstance = new tmImage.Webcam(400, 400, flip);
    await webcamInstance.setup();
    await webcamInstance.play();

    // Set the webcam instance to the state
    setwebcam(webcamInstance);
    return webcamInstance;
  };

  const startProcessing = () => {
    // Set a time interval for making predictions
    intervalIdRef.current = setInterval(() => {
      if (mymodel) {
        // const imageSrc = webcamRef.current.getScreenshot();
        // const img = new Image();
        // img.src = imageSrc;

        // console.log("web cam init ", webcamRef.current);
        predictImage()
          .then((data) => {
            console.log("predicted");
          })
          .catch((err) => {
            console.error("Error web cam init: ", err);
          });
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
  // const capture = () => {
  //   // console.log(myimage);

  //   const imageSrc = webcamRef.current.getScreenshot();
  //   // console.log("from capture", imageSrc.slice(0, 25));
  //   // sendImageToBackend(imageSrc);
  //   if (imageSrc) {
  //     const img = new Image();
  //     img.src = imageSrc;
  //     img.onload = () => predictImage(img).then(()=>{
  //       console.log()
  //     }).catch((err)=>{
  //       console.log(err)
  //     });
  //   }
  // };

  // console.log("out side useeffect ", mymodel)
  const predictImage = async (imageElement) => {
    try {
      // Check if the model is loaded

      const img = new Image();

      const video = webcam.webcam;
      const canvas = document.createElement("canvas");
      canvas.width = video.width;
      canvas.height = video.height;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Convert the image data to a data URL
      const dataURL = canvas.toDataURL("image/png");

      img.src = dataURL;
      // console.error("Model is not loaded.");
      //  console.log(webcamRef.current.canvas.width)
      img.onload = () => {
        async function callme() {
          const tensor = tf.browser.fromPixels(img);
          const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]);
          const preprocessed = resizedTensor.expandDims(0); // Ensure correct dimensions
          //  //  console.log(tensor)

          // console.log(preprocessed)
          const predictions = await mymodel.model.predict(preprocessed).data();

          return predictions;
        }

        callme().then((data) => {
          console.log(data[0], data[1]);
          setmodelpredictions({
            without_helmet: data[1],
            with_helmet: data[0],
          })
        }).catch((err) => {
          console.log(err);
        });

        // Rest of your code
      };
      // const canvas = document.createElement("canvas");
      // const context = canvas.getContext("2d");

      // canvas.width = videoElement.videoWidth;
      // canvas.height = videoElement.videoHeight;
      // context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      // console.log(canvas);

      // Log the current state of mymodel
      // console.log("mymodel state", mymodel);

      // // Convert image to a TensorFlow tensor
      //  const tensor = tf.browser.fromPixels(imageElement);
      // // const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]);
      // // // Preprocess the tensor (expand dimensions to match model input shape)
      //  const preprocessed = resizedTensor.expandDims(0);

      // // Make predictions
      // const predictions = await mymodel.model.predict(preprocessed).data();
      // setmodelpredictions({
      //   with_helmet: predictions[0],
      //   without_helmet: predictions[1],
      // });

      // const predictedClassIndex = tf.argMax(predictions).dataSync()[0];
      // // Display or handle predictions as needed
      // console.log("Predicted Class Index:", predictedClassIndex);

      // Cleanup
      // tensor.dispose();
      // resizedTensor.dispose();
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
          <Webcam screenshotFormat="image/jpeg" audio={false} mirrored width={720} height={400} />
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

          {showStartButton && (
            <button
              className="button1"
              onClick={startProcessing}
              disabled={isProcessing}
            >
              Start
            </button>
          )}

          {!showStartButton && (
            <button
              className="button1"
              onClick={stopProcessing}
              disabled={!isProcessing}
            >
              Stop
            </button>
          )}

          <div className="innerbox2text">
            <span className="innertext">
              with helmet:
              {modelpredictions.with_helmet.toFixed(5) >= 0.55555
                ? modelpredictions.with_helmet.toFixed(5)
                : "NO"}
            </span>
            <span className="innertext">
              without helmet:
              {modelpredictions.with_helmet.toFixed(5) <= 0.5555
                ? modelpredictions.without_helmet.toFixed(5)
                : "NO"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
