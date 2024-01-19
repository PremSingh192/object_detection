import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Accordion, Card, Spinner } from "react-bootstrap";
//import { Button, Card, Container, Row, Col } from "react-bootstrap";
import "../assets/images/App.css";
import * as tf from "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";
import axios from "axios";
import Webcam from "react-webcam";

export default function Home() {
  const navigate = useNavigate();
  const [mymodel, setMyModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const intervalIdRef = useRef(null);
  const [user, setuser] = useState(() => {
    const access = localStorage.getItem("access_token");
    if (access) {
      const user = jwtDecode(access);
      return user;
    } else {
      return null;
    }
  });

  const webcamRef = useRef(null);

  const [modelpredictions, setmodelpredictions] = useState({
    without_helmet: 0,
    with_helmet: 0,
  });

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
        const base = process.env.REACT_APP_MODEL_URL;
        const modelURL = base + "/model.json";
        const metadataURL = base + "/metadata.json";
        const model = await tmImage.load(modelURL, metadataURL);

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

    window.requestAnimationFrame(predictImage);
  }, []);
  const capture = async () => {
    // whether to flip the webcam

    // Initialize the webcam
    const webcamInstance = new tmImage.Webcam(400, 400, true);
    await webcamInstance.setup();
    await webcamInstance.play();

    // Set the webcam instance to the state
    webcamRef.current = webcamInstance;
    return webcamInstance;
  };
  function handlelogout() {
    localStorage.removeItem("access_token");
    return navigate("/login");
  }
  const startProcessing = () => {
    // Set a time interval for making predictions
    intervalIdRef.current = setInterval(() => {
      if (mymodel) {
        try {
          window.requestAnimationFrame(predictImage);
        } catch (error) {
          console.log(error);
        }

        // predictImage()
        //   .then((data) => {
        //     console.log("predicted");

        //   })
        //   .catch((err) => {
        //     console.error("Error web cam init: ", err);
        //   });
      }
    }, 1000); // Adjust the interval time as needed

    setIsProcessing(true);
    setShowStartButton(false);
  };

  const stopProcessing = () => {
    // Clear the time interval when the "Stop" button is clicked
    clearInterval(intervalIdRef.current);

    setIsProcessing(false);
    setShowStartButton(true);
  };

  const predictImage = async (imageElement) => {
    try {
      // Check if the model is loaded

      //const img = new Image();

      const video = webcamRef.current.webcam;
      const canvas = document.createElement("canvas");
      canvas.width = video.width;
      canvas.height = video.height;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const tensor = tf.browser.fromPixels(canvas);
      const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]);
      const preprocessed = resizedTensor.expandDims(0); // Ensure correct dimensions

      const predictions = await mymodel.model.predict(preprocessed).data();
      console.log(predictions[0], predictions[1]);

      setmodelpredictions({
        with_helmet: predictions[0],
        without_helmet: predictions[1],
      });
    } catch (error) {
      console.error("Error during prediction:", error);
    }
  };

  return (
    user && (
      <div className="outer">
        <div className="box_logout">
          <Accordion defaultActiveKey="0">
            <Card>
              <Card.Header>
                <Accordion.Header>{user.name}</Accordion.Header>

                <Accordion.Body>
                  <button onClick={handlelogout} className="button2">
                    logout
                  </button>
                </Accordion.Body>
              </Card.Header>
            </Card>
          </Accordion>
        </div>
        <div className="innerbox">
          <div className="inner_video">
            {!mymodel && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}{" "}
            {mymodel && (
              <Webcam
                screenshotFormat="image/jpeg"
                audio={false}
                mirrored
                width={600}
                height={400}
              />
            )}
          </div>
          <div className="innerbox2">
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
                {modelpredictions.with_helmet.toFixed(5) >= 0.51234
                  ? modelpredictions.with_helmet.toFixed(5)
                  : "NO"}
              </span>
              <span className="innertext">
                without helmet:
                {modelpredictions.with_helmet.toFixed(5) <= 0.51234
                  ? modelpredictions.without_helmet.toFixed(5)
                  : "NO"}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
