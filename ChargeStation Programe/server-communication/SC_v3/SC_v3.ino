#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>  // Include the ArduinoJson library for JSON parsing

const char* ssid = "Nita";               // Replace with your WiFi SSID
const char* password = "010924193Nita";  // Replace with your WiFi password

// API Endpoints
const char* requestUrl = "http://192.168.3.5:8081/requestData?stationID=";
const char* serverName = "http://192.168.3.5:8081/stationData";

// Data to send
int StationID = 1;
int targetPower = 100;
int chargePower = 9;
float cost = 13.4;
String ChargeProcess = "Charge";  // Initially empty
int ChargeHours = 1;
int ChargeMinutes = 20;
float latitude = 11.5963058, longitude = 104.7995911;  // Location coordinates

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;

    // Step 1: Update station data
    Serial.println("Updating station data...");
    http.begin(client, serverName);  // Start HTTP connection to server
    http.addHeader("Content-Type", "application/json");

    // JSON data for station update
    String stationData = "{";
    stationData += "\"stationID\": " + String(StationID) + ", ";
    stationData += "\"targetPower\": " + String(targetPower) + ", ";
    stationData += "\"chargePower\": " + String(chargePower) + ", ";
    stationData += "\"cost\": " + String(cost) + ", ";
    stationData += "\"chargeTime\": \"" + String(ChargeHours) + ":" + String(ChargeMinutes) + ":00\", ";
    stationData += "\"location\": \"" + String(longitude, 6) + " " + String(latitude, 6) + "\"";
    stationData += "}";

    int httpResponseCode = http.POST(stationData);

    if (httpResponseCode > 0) {
      Serial.println("Station data updated successfully!");
      Serial.println("Response code: " + String(httpResponseCode));
    } else {
      Serial.println("Failed to update station data: " + String(httpResponseCode));
    }
    http.end();

    // Step 2: Check payment status
    String paymentCheckUrl = String(requestUrl) + String(StationID);
    Serial.println("Checking payment status...");
    http.begin(client, paymentCheckUrl);
    httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Payment check response: " + response);

      // Parse JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);

      if (!error) {
        if (doc["chargeProcess"] == "wait") {
          Serial.println("Payment confirmed! Updating charge process...");

          // Step 3: Update chargeProcess
          http.end();
          http.begin(client, serverName);
          http.addHeader("Content-Type", "application/json");

          // JSON data for charge process update
          String chargeProcessData = "{";
          chargeProcessData += "\"stationID\": " + String(StationID) + ", ";
          chargeProcessData += "\"chargeProcess\": \"" + ChargeProcess + "\"";
          chargeProcessData += "}";

          httpResponseCode = http.POST(chargeProcessData);

          if (httpResponseCode > 0) {
            Serial.println("Charge process updated successfully!");
            Serial.println("Response code: " + String(httpResponseCode));
          } else {
            Serial.println("Failed to update charge process: " + String(httpResponseCode));
          }
        } else {
          Serial.println("Payment not confirmed, skipping charge process update.");
        }
      } else {
        Serial.println("Failed to parse payment response: " + String(error.c_str()));
      }
    } else {
      Serial.println("Failed to check payment status: " + String(httpResponseCode));
    }

    http.end();

    // Wait before next iteration
    delay(10000);  // Check every 10 seconds
  } else {
    Serial.println("WiFi not connected!");
  }
}
