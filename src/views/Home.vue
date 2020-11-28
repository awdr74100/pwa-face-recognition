<template>
  <div class="container-fluid px-0">
    <loading :active="spinner.fullscreen" :is-full-page="true" :opacity="0.7">
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
  data() {
    return {
      deviceId: '',
      cameras: [],
      errorMessage: '',
      spinner: { fullscreen: false },
      float32array: {},
      labels: [],
      firstDownload: true,
    };
  },
  methods: {
    async loadModel() {
      this.spinner.fullscreen = true;
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
      const vm = this;
      vm.spinner.fullscreen = true;
      console.log(vm.spinner.fullscreen);
      if (bind && vm.firstDownload) {
        await vm.$rtdbBind('float32array', db.ref('/members'));
        vm.firstDownload = false;
      }
      const webcam = document.querySelector('#webcam');
      const canvasDom = document.querySelector('canvas');
      const canvas = faceapi.createCanvasFromMedia(webcam);
      const canvasSize = { width: webcam.clientWidth, height: webcam.clientHeight };
      faceapi.matchDimensions(canvas, canvasSize);
      // reset canvas
      if (canvasDom) document.querySelector('.overlay').removeChild(canvasDom);
      document.querySelector('.overlay').appendChild(canvas);
      // load labels
      vm.labels = await vm.loadLabels();
      vm.spinner.fullscreen = false;
      console.log(vm.spinner.fullscreen);
      // start
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(webcam, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizeDetections = faceapi.resizeResults(detections, canvasSize);
        canvas.getContext('2d').clearRect(0, 0, canvasSize.width, canvasSize.height);
        let results = [];
        if (vm.labels.length > 0) {
          const faceMatcher = new faceapi.FaceMatcher(vm.labels, 0.4);
          results = resizeDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
        }
        // faceapi.draw.drawDetections(canvas, resizeDetections);
        resizeDetections.forEach((detection) => {
          const { score } = detection.detection;
          new faceapi.draw.DrawBox(
            {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height,
            },
            { boxColor: '#17a2b8' },
          ).draw(canvas);
          new faceapi.draw.DrawTextField(
            [`${Math.ceil(score * 100) / 100}`],
            detection.detection.box.bottomLeft,
            { backgroundColor: '#17a2b8' },
          ).draw(canvas);
          results.forEach((result, index) => {
            const { box } = resizeDetections[index].detection;
            const { label, distance } = result;
            new faceapi.draw.DrawTextField(
              [`${label} (${parseInt(distance * 100, 10)})`],
              box.bottomRight,
              { backgroundColor: '#17a2b8' },
            ).draw(canvas);
          });
        });
      }, 500);
    },
  },
  watch: {
    float32array() {
      if (!this.firstDownload) {
        // console.log('watch active');
        this.onVideoLive(false);
      }
    },
  },
  created() {
    this.loadModel();
  },
};
</script>
