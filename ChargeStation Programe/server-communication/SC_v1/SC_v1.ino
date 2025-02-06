#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "Nita";               // Replace with your WiFi SSID
const char* password = "010924193Nita";  // Replace with your WiFi password

// Use "ipconfig" in cmd to check the laptop IP that looks like (IPv4 Address:.........)
const char* serverName = "http://192.168.3.5:8081/stationData";  // Replace with your laptop's IP address and correct API endpoint

// Data to send
int StationID = 1;
int targetPower = 100;
int chargePower = 9;
float cost = 13.4;
String payment = "Complete";
String ChargeProcess = "Charge";
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
