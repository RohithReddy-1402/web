#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "Your_WiFi_SSID";
const char* password = "Your_WiFi_Password";
const char* serverAddress = "your_server_ip"; // Change to your server's IP
const int serverPort = 3000;

WebSocketsClient webSocket;

int sensorData[4][2] = {
    {450, 25}, // Sensor 1: Moisture, Temperature
    {380, 28}, // Sensor 2
    {500, 26}, // Sensor 3
    {420, 27}  // Sensor 4
};

void sendSensorData() {
    StaticJsonDocument<200> doc;
    JsonArray sensors = doc.createNestedArray("sensors");

    for (int i = 0; i < 4; i++) {
        JsonArray sensor = sensors.createNestedArray();
        sensor.add(sensorData[i][0]);  // Moisture
        sensor.add(sensorData[i][1]);  // Temperature
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

    webSocket.begin(serverAddress, serverPort, "/");
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    webSocket.loop();
    sendSensorData();
    delay(5000);  // Send data every 5 seconds
}
