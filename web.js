#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* ssid = "Your_WiFi_SSID";
const char* password = "Your_WiFi_Password";
const char* serverAddress = "your_server_ip";  // Replace with your server IP
const int serverPort = 3000;

WebSocketsClient webSocket;
Servo myServo;

int sensorData[4][3] = {
    {1, 450, 0},  // Sensor ID, Moisture, ON/OFF
    {2, 380, 0},
    {3, 500, 0},
    {4, 420, 0}
};

void sendSensorData() {
    StaticJsonDocument<200> doc;
    JsonArray sensors = doc.createNestedArray("sensors");

    for (int i = 0; i < 4; i++) {
        JsonArray sensor = sensors.createNestedArray();
        sensor.add(sensorData[i][0]);  // ID
        sensor.add(sensorData[i][1]);  // Moisture
        sensor.add(sensorData[i][2]);  // ON/OFF
    }

    String payload;
    serializeJson(doc, payload);
    webSocket.sendTXT(payload);  // Send JSON to backend
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED:
            Serial.println("Connected to server");
            break;

        case WStype_TEXT:
            Serial.printf("Message from server: %s\n", payload);

            StaticJsonDocument<200> doc;
            deserializeJson(doc, payload);

            JsonArray sensors = doc["sensors"];
            for (int i = 0; i < 4; i++) {
                sensorData[i][2] = sensors[i][2];  // Update ON/OFF state
            }

            // Control Servo based on first sensor's ON/OFF state
            if (sensorData[0][2] == 1) {
                myServo.write(90);
            } else {
                myServo.write(0);
            }
            break;
    }
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");

    myServo.attach(5);  // Connect servo to GPIO 5

    webSocket.begin(serverAddress, serverPort, "/");
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    webSocket.loop();
    sendSensorData();
    delay(5000);  // Send data every 5 seconds
}
