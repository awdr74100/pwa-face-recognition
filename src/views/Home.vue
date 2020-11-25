<template>
  <div class="container-fluid px-0">
    <loading :active="isLoading" :is-full-page="true" :opacity="0.7">
      <slot name="default">
        <span class="h3"><i class="fas fa-spinner fa-spin text-info"></i></span>
      </slot>
    </loading>
    <div class="d-flex flex-column align-items-center justify-content-center">
      <div class="p-3 w-100">
        <select class="form-control" v-model="deviceId">
          <option value="" disabled>-- Select Camera --</option>
          <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">{{
            camera.label
          }}</option>
        </select>
      </div>
      <div class="p-3 text-danger" v-if="errorMessage">{{ errorMessage }}</div>
      <div class="mx-3 overlay d-flex align-items-center justify-content-center">
        <vue-web-cam
          id="webcam"
          ref="webcam"
          width="100%"
          height="100%"
          :deviceId="deviceId"
          @cameras="onCameras"
          @error="onError"
          @video-live="onVideoLive(true)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import * as faceapi from 'face-api.js';
import db from '../db/firebase';

export default {
  // firebase: {
  //   float32array: db.ref('/members'),
  // },
  data() {
    return {
      deviceId: '',
      cameras: [],
      errorMessage: '',
      isLoading: false,
      float32array: {},
      firstDownload: true,
    };
  },
  methods: {
    async loadModel() {
      // this.isLoading = true;
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      ]);
    },
    onCameras(cameras) {
      this.cameras = cameras;
      this.deviceId = cameras[0].deviceId;
    },
    onError(error) {
      this.errorMessage = error;
    },
    async loadLabels() {
      const vm = this;
      const labels = Object.keys(vm.float32array);
      return Promise.all(
        labels.map(async (label) => {
          const descriptions = [];
          for (let i = 0; i < 5; i += 1) {
            const float32array = Float32Array.from(
              Object.values(JSON.parse(vm.float32array[label][i])),
            );
            descriptions.push(float32array);
          }
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        }),
      );
    },
    async onVideoLive(bind = true) {
      if (bind && this.firstDownload) {
        console.log('active');
        await this.$rtdbBind('float32array', db.ref('/members'));
        this.firstDownload = false;
      }
      const webcam = document.querySelector('#webcam');
      const canvasDom = document.querySelector('canvas');
      const canvas = faceapi.createCanvasFromMedia(webcam);
      const canvasSize = { width: webcam.clientWidth, height: webcam.clientHeight };
      faceapi.matchDimensions(canvas, canvasSize);
      if (canvasDom) document.querySelector('.overlay').removeChild(canvasDom);
      document.querySelector('.overlay').appendChild(canvas);
      const labels = await this.loadLabels();
      console.log(labels);
      // start
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(webcam, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizeDetections = faceapi.resizeResults(detections, canvasSize);
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6);
        const results = resizeDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
        canvas.getContext('2d').clearRect(0, 0, canvasSize.width, canvasSize.height);
        faceapi.draw.drawDetections(canvas, resizeDetections);
        resizeDetections.forEach(() => {
          results.forEach((result, index) => {
            const { box } = resizeDetections[index].detection;
            const { label, distance } = result;
            new faceapi.draw.DrawTextField(
              [`${label} (${parseInt(distance * 100, 10)})`],
              box.bottomRight,
            ).draw(canvas);
          });
        });
      }, 500);
    },
  },
  watch: {
    float32array() {
      if (!this.firstDownload) this.onVideoLive(false);
      // if (Object.keys(oldValue).length > 0) {
      //   this.onVideoLive(false);
      // }
    },
  },
  created() {
    this.loadModel();
  },
};
</script>
