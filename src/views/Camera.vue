<template>
  <div class="container-fluid px-0">
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
          @camera-change="onCameraChange"
          @error="onError"
          @notsupported="onError"
          @video-live="onVideoLive"
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
      loadedModels: false,
      boundDatabase: false,
      users: {},
    };
  },
  methods: {
    onCameras(cameras) {
      this.cameras = cameras;
      this.deviceId = cameras[0].deviceId;
    },
    onCameraChange() {
      this.$store.commit('SETLOADINGSTATUS', '相機啟動中');
      this.$store.commit('ISLOADING', true);
    },
    onError(error) {
      this.errorMessage = error;
      this.$store.commit('ISLOADING', false);
    },
    async onVideoLive() {
      if (!this.loadedModels) await this.loadModels();
      if (!this.boundDatabase) await this.bindDatabase();
      const webcam = document.querySelector('#webcam');
      const canvasDom = document.querySelector('canvas');
      const canvas = faceapi.createCanvasFromMedia(webcam);
      const canvasSize = { width: webcam.clientWidth, height: webcam.clientHeight };
      faceapi.matchDimensions(canvas, canvasSize);
      // reset canvas
      if (canvasDom) document.querySelector('.overlay').removeChild(canvasDom);
      document.querySelector('.overlay').appendChild(canvas);
      // load labels
      const labels = this.loadLabels();
      // close spinner loading
      this.$store.commit('ISLOADING', false);
      // start
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(webcam, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizeDetections = faceapi.resizeResults(detections, canvasSize);
        canvas.getContext('2d').clearRect(0, 0, canvasSize.width, canvasSize.height);
        // recognition
        const distanceArray = [];
        if (labels.length > 0) {
          const faceMatcher = new faceapi.FaceMatcher(labels, 0.35);
          const results = resizeDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
          results.forEach((result, index) => {
            const { box } = resizeDetections[index].detection;
            const { label, distance } = result;
            distanceArray[index] = distance;
            // boxDistance = distance;
            new faceapi.draw.DrawTextField(
              [`${label} (${parseInt(distance * 100, 10)})`],
              box.bottomRight,
              { backgroundColor: distance < 0.35 ? '#20c997' : '#6c757d' },
            ).draw(canvas);
          });
        }
        // detection
        resizeDetections.forEach((detection, index) => {
          // const score = Math.ceil(detection.detection.score * 100) / 100;
          new faceapi.draw.DrawBox(
            {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height,
            },
            { boxColor: (distanceArray[index] || 1) < 0.35 ? '#20c997' : '#6c757d' },
          ).draw(canvas);
          // new faceapi.draw.DrawTextField([`${score}`], detection.detection.box.bottomLeft, {
          //   backgroundColor: score > 0.85 ? '#20c997' : '#6c757d',
          // }).draw(canvas);
        });
      }, 500);
    },
    async bindDatabase() {
      this.$store.commit('SETLOADINGSTATUS', '資料同步中');
      await this.$rtdbBind('users', db.ref('/users'));
      this.boundDatabase = true;
      return Promise.resolve();
    },
    async loadModels() {
      this.$store.commit('SETLOADINGSTATUS', '模型載入中');
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      ]);
      this.loadedModels = true;
      return Promise.resolve();
    },
    loadLabels() {
      const vm = this;
      return Object.values(vm.users).map((user) => {
        const descriptions = [];
        const imageLength = 5;
        for (let i = 0; i < imageLength; i += 1) {
          const features = Object.values(JSON.parse(user.features[i]));
          const float32Array = Float32Array.from(features);
          descriptions.push(float32Array);
        }
        return new faceapi.LabeledFaceDescriptors(user.displayName, descriptions);
      });
    },
  },
  watch: {
    users() {
      if (!this.boundDatabase) return;
      this.onVideoLive();
    },
  },
  created() {
    this.$store.commit('SETLOADINGSTATUS', '相機啟動中');
    this.$store.commit('ISLOADING', true);
  },
};
</script>
