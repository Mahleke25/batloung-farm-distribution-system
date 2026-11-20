-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: batloung_farm_distribution_system
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `fruits`
--

DROP TABLE IF EXISTS `fruits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fruits` (
  `FruitID` int NOT NULL AUTO_INCREMENT,
  `FruitName` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `Status` enum('AVAILABLE','UNAVAILABLE') NOT NULL,
  PRIMARY KEY (`FruitID`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fruits`
--

INSERT INTO `fruits` VALUES (1,'Apples','Fresh red and green apples','AVAILABLE'),(2,'Bananas','Quality ripe bananas sourced from commercial fruit suppliers','AVAILABLE'),(3,'Oranges','Fresh citrus fruits suitable for retail and wholesale distribution','AVAILABLE'),(4,'Mangoes','Seasonal tropical mangoes selected for distribution','AVAILABLE'),(5,'Grapes','Fresh table grapes supplied for small and bulk retail orders','AVAILABLE');

--
-- Table structure for table `purchase_details`
--

DROP TABLE IF EXISTS `purchase_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_details` (
  `PurchaseDetailID` int NOT NULL AUTO_INCREMENT,
  `PurchaseID` int NOT NULL,
  `FruitID` int NOT NULL,
  `Quantity` int NOT NULL,
  `UnitCost` decimal(12,2) NOT NULL,
  `PackagingSize` enum('SMALL','MEDIUM','LARGE') NOT NULL,
  PRIMARY KEY (`PurchaseDetailID`),
  KEY `fk_purchase_details_purchases_idx` (`PurchaseID`),
  KEY `fk_purchase_details_fruits_idx` (`FruitID`),
  CONSTRAINT `fk_purchase_details_fruits` FOREIGN KEY (`FruitID`) REFERENCES `fruits` (`FruitID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_details_purchases` FOREIGN KEY (`PurchaseID`) REFERENCES `purchases` (`PurchasesID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_details`
--

INSERT INTO `purchase_details` VALUES (1,1,1,50,30.00,'SMALL'),(2,1,1,50,30.00,'MEDIUM'),(3,1,2,100,25.00,'MEDIUM'),(4,1,3,100,30.00,'LARGE'),(5,2,4,100,25.00,'SMALL'),(6,2,5,100,44.00,'LARGE'),(7,3,1,100,28.00,'MEDIUM'),(8,3,4,50,30.00,'MEDIUM'),(9,3,4,50,30.00,'LARGE'),(10,3,5,50,40.00,'SMALL'),(11,4,2,50,24.00,'SMALL'),(12,4,2,50,24.00,'LARGE'),(13,4,3,100,28.00,'MEDIUM'),(14,4,4,80,25.00,'LARGE'),(15,5,1,100,30.00,'LARGE'),(16,5,3,100,30.00,'SMALL'),(17,5,5,60,40.00,'MEDIUM'),(19,33,1,10,30.00,'SMALL'),(20,33,3,5,30.00,'LARGE'),(21,34,4,2,300.75,'SMALL');

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `PurchasesID` int NOT NULL AUTO_INCREMENT,
  `SupplierID` int NOT NULL,
  `PurchaseDate` date NOT NULL,
  `TotalAmount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`PurchasesID`),
  KEY `fk_purchases_suppliers_idx` (`SupplierID`),
  CONSTRAINT `fk_purchases_suppliers` FOREIGN KEY (`SupplierID`) REFERENCES `suppliers` (`SupplierID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` VALUES (1,1,'2026-10-28',8500.00),(2,2,'2026-10-30',6900.00),(3,3,'2026-11-02',7800.00),(4,4,'2026-11-05',7200.00),(5,5,'2026-11-08',8400.00),(33,1,'2026-11-18',450.00),(34,2,'2026-11-19',601.50);

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `SaleID` int NOT NULL AUTO_INCREMENT,
  `VendorID` int NOT NULL,
  `SaleDate` datetime NOT NULL,
  `PaymentStatus` enum('PAID','PARTIALLY_PAID','UNPAID') NOT NULL,
  `TotalAmount` decimal(12,2) NOT NULL,
  `PaymentMethod` enum('CASH','MOBILE_MONEY','CREDIT') NOT NULL,
  `AmountPaid` decimal(12,2) NOT NULL,
  PRIMARY KEY (`SaleID`),
  KEY `fk_sales_vendors_idx` (`VendorID`),
  CONSTRAINT `fk_sales_vendors` FOREIGN KEY (`VendorID`) REFERENCES `vendors` (`VendorID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` VALUES (1,1,'2026-11-10 09:30:00','PAID',445.00,'CASH',445.00),(2,2,'2026-11-11 11:15:00','PARTIALLY_PAID',690.00,'MOBILE_MONEY',400.00),(3,3,'2026-11-12 14:00:00','UNPAID',562.00,'CREDIT',0.00),(4,4,'2026-11-13 10:45:00','PAID',695.00,'MOBILE_MONEY',695.00),(5,5,'2026-11-14 12:20:00','PARTIALLY_PAID',440.00,'CREDIT',200.00),(9,1,'2026-11-18 09:00:00','PAID',255.00,'CASH',255.00),(10,5,'2026-11-19 13:21:00','UNPAID',60.00,'CASH',0.00),(11,5,'2026-11-19 17:12:00','UNPAID',60.00,'CASH',0.00);

--
-- Table structure for table `sales_details`
--

DROP TABLE IF EXISTS `sales_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_details` (
  `SaleDetailID` int NOT NULL AUTO_INCREMENT,
  `SaleID` int NOT NULL,
  `FruitID` int NOT NULL,
  `PackagingSize` enum('SMALL','MEDIUM','LARGE') NOT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(12,2) NOT NULL,
  PRIMARY KEY (`SaleDetailID`),
  KEY `fk_sales_details_sales_idx` (`SaleID`),
  KEY `fk_sales_details_fruits_idx` (`FruitID`),
  CONSTRAINT `fk_sales_details_fruits` FOREIGN KEY (`FruitID`) REFERENCES `fruits` (`FruitID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_details_sales` FOREIGN KEY (`SaleID`) REFERENCES `sales` (`SaleID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_details`
--

INSERT INTO `sales_details` VALUES (1,1,1,'SMALL',5,45.00),(2,1,2,'MEDIUM',4,55.00),(3,2,3,'LARGE',6,85.00),(4,2,5,'SMALL',3,60.00),(5,3,4,'LARGE',5,82.00),(6,3,2,'SMALL',4,38.00),(7,4,5,'MEDIUM',5,85.00),(8,4,1,'LARGE',3,90.00),(9,5,3,'MEDIUM',4,60.00),(10,5,4,'SMALL',5,40.00),(13,9,1,'SMALL',2,45.00),(14,9,2,'MEDIUM',3,55.00),(15,10,5,'SMALL',1,60.00),(16,11,5,'SMALL',1,60.00);

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `StockID` int NOT NULL AUTO_INCREMENT,
  `FruitID` int NOT NULL,
  `PackagingSize` enum('SMALL','MEDIUM','LARGE') NOT NULL,
  `AvailableQuantity` int NOT NULL,
  `SellingPrice` decimal(12,2) NOT NULL,
  PRIMARY KEY (`StockID`),
  UNIQUE KEY `uq_stock_fruit_packaging` (`FruitID`,`PackagingSize`),
  KEY `fk_stock_fruits_idx` (`FruitID`),
  CONSTRAINT `fk_stock_fruits` FOREIGN KEY (`FruitID`) REFERENCES `fruits` (`FruitID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` VALUES (1,1,'SMALL',55,45.00),(2,1,'MEDIUM',100,65.00),(3,1,'LARGE',97,90.00),(4,2,'SMALL',46,38.00),(5,2,'MEDIUM',93,55.00),(6,2,'LARGE',50,75.00),(7,3,'SMALL',100,42.00),(8,3,'MEDIUM',96,60.00),(9,3,'LARGE',99,85.00),(10,4,'SMALL',97,40.00),(11,4,'MEDIUM',50,58.00),(12,4,'LARGE',125,82.00),(13,5,'SMALL',45,60.00),(14,5,'MEDIUM',55,85.00),(15,5,'LARGE',100,120.00);

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `SupplierID` int NOT NULL AUTO_INCREMENT,
  `BusinessName` varchar(150) NOT NULL,
  `ContactPerson` varchar(100) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Province` varchar(50) NOT NULL,
  `Address` varchar(255) NOT NULL,
  PRIMARY KEY (`SupplierID`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` VALUES (1,'Highveld Orchard Collective','Naledi Mokoena','+27 11 555 0101','Gauteng','Agricultural Park, Pretoria'),(2,'Eden Harvest Produce','Thabo Molefe','+27 51 555 0102','Free State','Farm Road, Bloemfontein'),(3,'Coastal Fresh Distributors','Zanele Khumalo','+27 31 555 0103','KwaZulu-Natal','Market District, Pietermaritzburg'),(4,'Cape Valley Fruit Traders','Lerato Jacobs','+27 21 555 0104','Western Cape','Fruit Market Road, Paarl'),(5,'Lowveld Citrus Partners','Kagiso Ndlovu','+27 13 555 0105','Mpumalanga','Orchard Lane, Mbombela');

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `VendorID` int NOT NULL AUTO_INCREMENT,
  `VendorName` varchar(150) NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `Location` varchar(150) NOT NULL,
  `RegistrationDate` date NOT NULL,
  PRIMARY KEY (`VendorID`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` VALUES (1,'Mabote Corner Retailers','+266 22 555 101','Mabote, Maseru','2026-08-12'),(2,'Pioneer Fresh Market','+266 22 555 102','Pioneer Road, Maseru','2026-09-03'),(3,'Ha Thetsane Mini Wholesale','+266 22 555 103','Thetsane, Maseru','2026-07-21'),(4,'Moshoeshoe Road Fruit Stall','+266 22 555 104','Moshoeshoe Road, Maseru','2026-10-05'),(5,'Qoaling Family Grocers','+266 22 555 105','Qoaling, Maseru','2026-09-18');
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-20  8:53:44
