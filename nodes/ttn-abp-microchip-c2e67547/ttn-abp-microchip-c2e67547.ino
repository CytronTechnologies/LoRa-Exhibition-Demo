#include "LoRaShield.h"
#include <SoftwareSerial.h>
#include <TinyGPS.h>
//#include <Wire.h>
//#include "rgb_lcd.h"

#define B 3975

//rgb_lcd lcd;

// Set your DevAddr
const byte devAddr[4] = {0xC2, 0xE6, 0x75, 0x47}; //for example: {0x02, 0xDE, 0xAE, 0x00};

// Set your NwkSKey and AppSKey
const byte nwkSKey[16] = {0x6D, 0xBC, 0x69, 0x3E, 0xC8, 0xBA, 0x27, 0x30, 0xE4, 0x0A, 0xEE, 0x8A, 0x9D, 0xD2, 0x79, 0x2A}; //for example: {0x2B, 0x7E, 0x15, 0x16, 0x28, 0xAE, 0xD2, 0xA6, 0xAB, 0xF7, 0x15, 0x88, 0x09, 0xCF, 0x4F, 0x3C};
const byte appSKey[16] = {0xD7, 0xF6, 0xE0, 0x89, 0x7A, 0x3D, 0xDB, 0xE9, 0x05, 0x05, 0x3F, 0x43, 0x65, 0x12, 0xA2, 0xD2}; //for example: {0x2B, 0x7E, 0x15, 0x16, 0x28, 0xAE, 0xD2, 0xA6, 0xAB, 0xF7, 0x15, 0x88, 0x09, 0xCF, 0x4F, 0x3C};

unsigned long previousMillis = 0;
char previousButton = -1;
#define sendingFreq 20000

#define debugSerial Serial
//#define loraSerial Serial5 // CT-ARM with RX pin 10 and TX pin 11
SoftwareSerial loraSerial(2, 3);

TinyGPS gps;
#define ss Serial5 // CT-ARM with RX pin 8 and TX pin 9
//SoftwareSerial ss(10, 11);

#define debugPrintLn(...) { if (debugSerial) debugSerial.println(__VA_ARGS__); }
#define debugPrint(...) { if (debugSerial) debugSerial.print(__VA_ARGS__); }

TheThingsUno ttu;

void setup() {
  debugSerial.begin(115200);
  loraSerial.begin(57600);
  ss.begin(9600);

  //lcd.begin(16, 2);
  //lcd.setRGB(0, 0, 200);
 
  ttu.init(loraSerial, debugSerial);
  delay(1000);
  ttu.reset();

  //for testing purpose only with single channel LoRa gateway
  //Comment this line if you are using multiple-channel gateway
  ttu.enableOneChannel(10); //freq: 904.3MHz

  //the device will configure the LoRa module
  ttu.personalize(devAddr, nwkSKey, appSKey);

  delay(6000);
  ttu.showStatus();
  debugPrintLn(F("Setup for The Things Network complete"));
  //lcd.print(F("Setup complete"));

  delay(1000);
  previousMillis = millis();
  //lcd.clear();
}

void loop() {

  //ttu.sendString(message);
  //delay(20000);

  //read temperature
  int val = analogRead(0);
  float resistance=(float)(1023-val)*10000/val; //get the resistance of the sensor;
  float temperature=1/(log(resistance/10000)/B+1/298.15)-273.15;//convert to temperature via datasheet;
  //lcd.setCursor(0,0);
  //lcd.print(temperature);
  debugPrint("Temperature:");
  debugPrintLn(temperature);
  
  //lcd.setCursor(0,1);
  //lcd.print(F("BTN:"));
  char currentButton = digitalRead(8);
  if(currentButton!= previousButton){
    if(currentButton){ 
      //lcd.print(F("pressed "));
      debugPrintLn("Button state: Pressed");
      //do_send(&sendjob);
    }
    else{
      //lcd.print(F("released"));
      debugPrintLn("Button state: Released");
    }
    previousButton = currentButton;
  }
  
  //ss.listen();
  bool newData = false;
  unsigned long chars;
  unsigned short sentences, failed;

  // For one second we parse GPS data and report some key values
  for (unsigned long start = millis(); millis() - start < 1000;)
  {
    while (ss.available())
    {
      char c = ss.read();
      // Serial.write(c); // uncomment this line if you want to see the GPS data flowing
      if (gps.encode(c)) // Did a new valid sentence come in?
        newData = true;
    }
  }

  if (newData)
  {
    float flat, flon;
    unsigned long age;
    gps.f_get_position(&flat, &flon, &age);
    Serial.print(F("LAT="));
    Serial.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
    Serial.print(F(" LON="));
    Serial.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);
//    Serial.print(F(" SAT="));
//    Serial.print(gps.satellites() == TinyGPS::GPS_INVALID_SATELLITES ? 0 : gps.satellites());
//    Serial.print(F(" PREC="));
//    Serial.print(gps.hdop() == TinyGPS::GPS_INVALID_HDOP ? 0 : gps.hdop());
    Serial.println();
    if(millis()> previousMillis + sendingFreq){
      unsigned long lat_converted = flat * 10E5;
      unsigned long long_converted = flon * 10E5;
      uint8_t mydata[11] = {0};
      mydata[0] = (lat_converted & 0xFF000000) >> 24;
      mydata[1] = (lat_converted & 0xFF0000) >> 16;
      mydata[2] = (lat_converted & 0xFF00) >> 8;
      mydata[3] = lat_converted & 0xFF;
      mydata[4] = (long_converted & 0xFF000000) >> 24;
      mydata[5] = (long_converted & 0xFF0000) >> 16;
      mydata[6] = (long_converted & 0xFF00) >> 8;
      mydata[7] = long_converted & 0xFF;
      mydata[8] = 't';
      mydata[9] = ((int)((round(temperature*100)/100.00)*100) & 0xFF00) >> 8;
      mydata[10] = (int)((round(temperature*100)/100.00)*100) & 0xFF;
      
      ttu.sendBytes(mydata, sizeof(mydata));
      previousMillis = millis();
    }  
  }
  
  gps.stats(&chars, &sentences, &failed);
//  Serial.print(F(" CHARS="));
//  Serial.print(chars);
//  Serial.print(F(" SENTENCES="));
//  Serial.print(sentences);
//  Serial.print(F(" CSUM ERR="));
//  Serial.println(failed);

  if (chars == 0)
    Serial.println(F("** No characters received from GPS: check wiring **"));
}
