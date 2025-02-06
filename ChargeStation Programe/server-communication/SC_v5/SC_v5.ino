#include <WiFi.h>
#include <HTTPClient.h>
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
    // Step 1: Check charge process status
    if (checkChargeProcess(StationID) == "waiting") {
      // Step 2: Update charge process
      updateChargeProcess(StationID, ChargeProcess);

      // Step 3: Update station data
      updateStationData(StationID, targetPower, chargePower, cost, ChargeHours, ChargeMinutes, latitude, longitude);
    }
  }
}

// Function to check charge process status
String checkChargeProcess(int stationID) {
  HTTPClient http;
  String chargeProcessCheckUrl = String(requestUrl) + String(stationID);
  http.begin(chargeProcessCheckUrl);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    if (!error) {
        http.end();
        return doc["chargeProcess"];  // Charge process is "waiting", proceed with update
    }else {
    return "";
    }
  }else {
    return "";
  }
  http.end();
  return "";
}

// Function to update charge process
void updateChargeProcess(int stationID, String chargeProcess) {
  HTTPClient http;
  http.begin(serverName);
  http.addHeader("Content-Type", "application/json");

  // JSON data for charge process update
  String chargeProcessData = "{";
  chargeProcessData += "\"stationID\": " + String(stationID) + ", ";
  chargeProcessData += "\"chargeProcess\": \"" + chargeProcess + "\"";
  chargeProcessData += "}";

  int httpResponseCode = http.POST(chargeProcessData);

  if (httpResponseCode > 0) {
    Serial.println("Charge process updated successfully!");
    Serial.println("Response code: " + String(httpResponseCode));
  } else {
    Serial.println("Failed to update charge process: " + String(httpResponseCode));
  }
  http.end();
}

// Function to update station data
void updateStationData(int stationID, int targetPower, int chargePower, float cost, int chargeHours, int chargeMinutes, float latitude, float longitude) {
  HTTPClient http;
  http.begin(serverName);  // Start HTTP connection to server
  http.addHeader("Content-Type", "application/json");

  // JSON data for station update
  String stationData = "{";
  stationData += "\"stationID\": " + String(stationID) + ", ";
  stationData += "\"targetPower\": " + String(targetPower) + ", ";
  stationData += "\"chargePower\": " + String(chargePower) + ", ";
  stationData += "\"cost\": " + String(cost) + ", ";
  stationData += "\"chargeTime\": \"" + String(chargeHours) + ":" + String(chargeMinutes) + ":00\", ";
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
}
