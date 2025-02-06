#define Weld_pin 4

void setup() {
  Serial.begin(115200);
  pinMode(Weld_pin,INPUT); 

}

void loop() {
  float Weld = analogRead(Weld_pin);
  Serial.println(Weld);
  delay(20);
}
