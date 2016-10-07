#include "LoRaShield.h"
#include <SoftwareSerial.h>
#include <Wire.h>
#include "rgb_lcd.h"

#define B 3975

rgb_lcd lcd;

// Set your DevAddr
const byte devAddr[4] = { 0x70, 0x2C, 0x0F, 0xD9 };

// Set your NwkSKey and AppSKey
const byte nwkSKey[16] = { 0x0E, 0x46, 0x0B, 0x3F, 0x1E, 0x2E, 0x31, 0x62, 0x97, 0x43, 0x1E, 0x57, 0xFB, 0x09, 0x6B, 0x5D };
const byte appSKey[16] = { 0xB7, 0xA3, 0x25, 0x77, 0x89, 0x6B, 0xE2, 0x69, 0x14, 0xB0, 0x96, 0x2C, 0xFC, 0x05, 0xCB, 0xEF };
unsigned long previousMillis = 0;
char previousButton = -1;
double flat = 5.314874;
double flon = 100.481275;
float previousLight = 0;
#define sendingFreq 20000

#define debugSerial Serial
SoftwareSerial loraSerial(2, 3);

#define debugPrintLn(...) { if (debugSerial) debugSerial.println(__VA_ARGS__); }
#define debugPrint(...) { if (debugSerial) debugSerial.print(__VA_ARGS__); }

TheThingsUno ttu;

void setup() {

  pinMode(12, INPUT_PULLUP);
  
  debugSerial.begin(115200);
  loraSerial.begin(57600);
  lcd.begin(16, 2);
  lcd.setRGB(100, 0, 200);
 
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
  lcd.print(F("Setup LoRa"));
  lcd.setCursor(0,1);
  lcd.print(F("complete"));

  delay(2000);
  previousMillis = millis();
  lcd.clear();
}

void loop() {

  //read temperature;
  int sensorValue = analogRead(0); 
  float light = (float)(1023-sensorValue)*10/sensorValue;
  
  if(previousLight != light){
    lcd.setCursor(0,0);
    lcd.print(F("LIGHT:"));
    lcd.print(light);
    //debugPrint("Temperature:");
    //debugPrintLn(temperature);
    previousLight = light;
  }
  
  lcd.setCursor(0,1);
  lcd.print(F("BTN:"));
  char currentButton = digitalRead(12);
  if(currentButton!= previousButton){
    if(currentButton == LOW){ 
      lcd.print(F("pressed "));
      //debugPrintLn("Button state: Pressed");
    }
    else{
      lcd.print(F("released"));
      //debugPrintLn("Button state: Released");
    }
    previousButton = currentButton;
  }

    if(millis()> previousMillis + sendingFreq){
      unsigned long lat_converted = flat * 1000000;
      unsigned long long_converted = flon * 1000000;
      uint8_t mydata[11] = {0};
      mydata[0] = (lat_converted & 0xFF000000) >> 24;
      mydata[1] = (lat_converted & 0xFF0000) >> 16;
      mydata[2] = (lat_converted & 0xFF00) >> 8;
      mydata[3] = lat_converted & 0xFF;
      mydata[4] = (long_converted & 0xFF000000) >> 24;
      mydata[5] = (long_converted & 0xFF0000) >> 16;
      mydata[6] = (long_converted & 0xFF00) >> 8;
      mydata[7] = long_converted & 0xFF;
      mydata[8] = 'l';
      mydata[9] = ((int)((round(light*100)/100.00)*100) & 0xFF00) >> 8;
      mydata[10] = (int)((round(light*100)/100.00)*100) & 0xFF;
      
      ttu.sendBytes(mydata, sizeof(mydata));
      previousMillis = millis();
    }  
}
