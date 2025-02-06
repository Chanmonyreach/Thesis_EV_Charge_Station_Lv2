#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "Nita";               // Replace with your WiFi SSID
const char* password = "010924193Nita";  // Replace with your WiFi password

// Use "ipconfig" in cmd to check the laptop IP that looks like (IPv4 Address:.........)
const char* serverName = "http://192.168.3.5:8081/stationData";  // Replace with your laptop's IP address and correct API endpoint

// Data to send
int StationID = 1;
float targetPower = 1;
float currentPower = 0.001;
float chargePower = 0.0;
float cost = 13.4;
String payment = "Complete";
String ChargeProcess = "Charge";
int ChargeHours = 1;
int ChargeMinutes = 20;
float latitude = 11.5963058, longitude = 104.7995911;  // Location coordinates

void setup() {
  Serial.begin(115200);
  Serial.println("Enter data to modify:");
  Serial.println("Example: StationID=2 targetPower=150 chargePower=10 cost=20.5");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Check if there's new data in the serial monitor
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    processInput(input);
    //example: StationID=1 targetPower=150 currentPower=10 cost=20.5
  }

  chargePower = (currentPower/targetPower) * 100;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;  // Create a WiFiClient object to pass to the HTTPClient

    // Use the WiFiClient object with http.begin()
    http.begin(client, serverName);  // Specify the server URL and the WiFiClient object

    // Set content type to JSON
    http.addHeader("Content-Type", "application/json");

    // Create JSON data
    String jsonData = "{";
    jsonData += "\"stationID\": " + String(StationID) + ", ";
    jsonData += "\"targetPower\": " + String(targetPower) + ", ";
    jsonData += "\"chargePower\": " + String(chargePower) + ", ";
    jsonData += "\"cost\": " + String(cost) + ", ";
    jsonData += "\"payment\": \"" + payment + "\", ";
    jsonData += "\"chargeProcess\": \"" + ChargeProcess + "\", ";
    jsonData += "\"chargeTime\": \"" + String(ChargeHours) + ":" + String(ChargeMinutes) + ":00\", ";  // Format chargeTime as HH:MM:SS
    jsonData += "\"location\": \"" + String(longitude, 6) + " " + String(latitude, 6) + "\"";   // Format location as POINT(lon lat)
    jsonData += "}";

    // Send HTTP POST request with the JSON data
    int httpResponseCode = http.POST(jsonData);

    // Check response
    if (httpResponseCode > 0) {
      Serial.println("Data sent successfully");
      Serial.println("Response code: " + String(httpResponseCode));
    } else {
      Serial.println("Error sending data: " + String(httpResponseCode));
      String response = http.getString();  // Get any response from the server
      Serial.println("Response: " + response);
    }

    http.end();  // End HTTP request

    // Wait before sending data again (you can adjust this time interval)
    delay(10000);  // Send data every 10 seconds
  } else {
    Serial.println("WiFi not connected!");
  }
}

void processInput(String input) {
  // Remove leading and trailing spaces (if any)
  input.trim();
  
  // Parse and update the variables
  if (input.indexOf("StationID=") >= 0) {
    StationID = extractValue(input, "StationID=");
    Serial.println("StationID updated to: " + String(StationID));
  }
  if (input.indexOf("targetPower=") >= 0) {
    targetPower = extractValueFloat(input, "targetPower=");
    Serial.println("targetPower updated to: " + String(targetPower));
  }
  if (input.indexOf("currentPower=") >= 0) {
    currentPower = extractValueFloat(input, "currentPower=");
    Serial.println("currentPower updated to: " + String(currentPower));
  }
  if (input.indexOf("cost=") >= 0) {
    cost = extractValueFloat(input, "cost=");
    Serial.println("cost updated to: " + String(cost));
  }
}

int extractValue(String input, String key) {
  int keyIndex = input.indexOf(key);
  if (keyIndex >= 0) {
    String valueStr = input.substring(keyIndex + key.length());
    valueStr.trim();  // Remove any extra spaces
    return valueStr.toInt();  // Convert to integer
  }
  return 0;  // Return 0 if the key is not found
}

float extractValueFloat(String input, String key) {
  int keyIndex = input.indexOf(key);
  if (keyIndex >= 0) {
    String valueStr = input.substring(keyIndex + key.length());
    valueStr.trim();  // Remove any extra spaces
    return valueStr.toFloat();  // Convert to float
  }
  return 0.0;  // Return 0.0 if the key is not found
}

