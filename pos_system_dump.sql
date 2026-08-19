-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pos_system
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `company_info`
--

DROP TABLE IF EXISTS `company_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `default_print_format` varchar(50) DEFAULT 'A4',
  `logo_path` varchar(255) DEFAULT NULL,
  `signature_path` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_account_no` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_info`
--

LOCK TABLES `company_info` WRITE;
/*!40000 ALTER TABLE `company_info` DISABLE KEYS */;
INSERT INTO `company_info` VALUES (1,'Sri Balaji Renewables','No: 240, Netaji Rd, near Railway Station, Royal Nagar, Tirupati, Andhra Pradesh 517501','9849099800','hello@sribalajirenewables.com','37AGQPC5310B1ZV','A4',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `company_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_gst_customer` tinyint(1) DEFAULT 0,
  `is_gst_registered` tinyint(1) NOT NULL DEFAULT 0,
  `gstin` varchar(15) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (3,'Doraswamy Raju Meesala','07997991101','doraswamyraju.ca@gmail.com','',0,0,NULL,0),(4,'Rajugari Ventures','7997991101','rajugariventures@gmail.com','Tirupati',0,0,NULL,1),(5,'Doraswamy Raju Meesala','07997991101','rajugariventures@gmail.com','#38, 1st Floor, TUDA Complex,\nBairagipatteda',0,0,NULL,1);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `followup_reminder` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'New',
  `notes` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assigned_to_user_id` (`assigned_to_user_id`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (4,'Doraswamy Raju Meesala','7997991101','rajugariventures@gmail.com','Direct',2,NULL,'Contacted','Scheduled follow-up on 2026-08-19T07:57','','2025-09-11 10:30:19');
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT 0.00,
  `stock_level` int(11) NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `products_ibfk_1` (`supplier_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'10\" spun','',0.00,0.00,49,'spun-01','RO System Components',NULL),(2,'pre filter','',0.00,0.00,7,'','RO System Components',NULL),(3,'Membrane',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(4,'membrane housing',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(5,'sedmint',NULL,0.00,0.00,1,NULL,'RO System Components',NULL),(6,'precarbon',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(7,'post carbon',NULL,0.00,0.00,5,NULL,'RO System Components',NULL),(8,'coper filter',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(9,'classic filters',NULL,0.00,0.00,27,NULL,'RO System Components',NULL),(10,'sv',NULL,0.00,0.00,12,NULL,'RO System Components',NULL),(11,'1.5smps',NULL,0.00,0.00,10,NULL,'RO System Components',NULL),(12,'2.5 smps',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(13,'2.5 smps pin',NULL,0.00,0.00,8,NULL,'RO System Components',NULL),(14,'UV',NULL,0.00,0.00,-2,NULL,'RO System Components',NULL),(15,'1/2\" SV',NULL,0.00,0.00,7,NULL,'RO System Components',NULL),(16,'FR450',NULL,0.00,0.00,40,NULL,'RO System Components',NULL),(17,'100 GPD PUMP',NULL,0.00,0.00,4,NULL,'RO System Components',NULL),(18,'300 GPD PUMP',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(19,'Float',NULL,0.00,0.00,46,NULL,'RO System Components',NULL),(20,'Bag filter',NULL,0.00,0.00,7,NULL,'RO System Components',NULL),(21,'kent Taps',NULL,0.00,0.00,22,NULL,'RO System Components',NULL),(22,'Jade Taps',NULL,0.00,0.00,19,NULL,'RO System Components',NULL),(23,'TDS Meter',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(24,'20\" Slim thread',NULL,0.00,0.00,22,NULL,'RO System Components',NULL),(25,'20\" Slim spun',NULL,0.00,0.00,12,NULL,'RO System Components',NULL),(26,'20\" Jumbo bag filter housing',NULL,0.00,0.00,1,NULL,'RO System Components',NULL),(27,'3KV Solar Heater',NULL,0.00,0.00,3,NULL,'Solar Water Heaters',NULL),(28,'pre filter handle',NULL,0.00,0.00,16,NULL,'RO System Components',NULL),(29,'20\" Slim housing',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(30,'6KV solar heater',NULL,0.00,0.00,8,NULL,'Solar Water Heaters',NULL),(31,'airwint',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(32,'pressure realise valve',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(33,'5030 chemical',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(34,'20\" СТО',NULL,0.00,0.00,5,NULL,'RO System Components',NULL),(35,'Dozer chemical',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(36,'20\" Jumbo thread',NULL,0.00,0.00,2,NULL,'RO System Components',NULL),(37,'20\" Jumbo Spun',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(38,'20\" Jumbo Housing',NULL,0.00,0.00,3,NULL,'RO System Components',NULL),(39,'Anti scall balls',NULL,0.00,0.00,15,NULL,'RO System Components',NULL),(40,'Royal pearl Coper',NULL,0.00,0.00,4,NULL,'Branded Products',NULL),(41,'Purosis White',NULL,0.00,0.00,3,NULL,'Branded Products',NULL),(42,'Aqua Nine Black',NULL,0.00,0.00,5,NULL,'Branded Products',NULL),(43,'Dolphin',NULL,0.00,0.00,3,NULL,'Branded Products',NULL),(44,'Aqua Pearl',NULL,0.00,0.00,3,NULL,'Branded Products',NULL),(45,'Finepure white',NULL,0.00,0.00,2,NULL,'Branded Products',NULL),(46,'Finepure Blue',NULL,0.00,0.00,2,NULL,'Branded Products',NULL),(47,'Purosis ocean blue',NULL,0.00,0.00,1,NULL,'Branded Products',NULL),(48,'Innovica Blue',NULL,0.00,0.00,1,NULL,'Branded Products',NULL),(49,'innovica white',NULL,0.00,0.00,1,NULL,'Branded Products',NULL),(50,'Aqua Nine white',NULL,0.00,0.00,1,NULL,'Branded Products',NULL),(51,'Aqua jade',NULL,0.00,0.00,5,NULL,'Branded Products',NULL),(52,'RO PIPE 6mm',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(53,'RO PIPE 8mm',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(54,'PUMP ELBOWS',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(55,'MEMBRANE HOUSING ELBOWS',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(56,'TWO SIDE PUSHING ELBOWS',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(57,'HOUSING ELBOWS',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(58,'INLET VALVE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(59,'1/4 FEMALE CONNECTOR',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(60,'100 GPD MEMBRANE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(61,'25 LPH',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(62,'50 LPH',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(63,'100 LPH',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(64,'BODY CONNECTOR',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(65,'500 LTR SS TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(66,'SS SKID',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(67,'HIGH PRESSURE PUMP 2 HP',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(68,'RAW WATER PUMP 1 HP',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(69,'CONTROL PANEL SINGLE FACE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(70,'FLOW METER',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(71,'PRESSURE GUAGE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(72,'4040 MEMBRANE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(73,'4040 MEMBRANE HOUSING',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(74,'CARBON',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(75,'DOSING PUMP',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(76,'M/F CONNECTER',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(77,'8040 MEMBRANE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(78,'8040 MEMBRANE HOUSING',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(79,'1000 LTR SS TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(80,'2000 LTR SS TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(81,'2000 RAW WATER TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(82,'3000 RAW WATER TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(83,'5000 RAW WATER TANK',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(84,'$13*54$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(85,'$14*65$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(86,'$16*65$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(87,'$18*65$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(88,'$21*62$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(89,'$24*72$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(90,'$30*72$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(91,'$36*72$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(92,'$48*72$ PENTAIRE VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(93,'25 MB M/F',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(94,'25 MB T/F',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(95,'40 MB M/F',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(96,'40 MB T/F',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(97,'40 MB SIDE MOUNT TOP AND BOTTOM',' ',0.00,0.00,0,NULL,'RO System Components',NULL),(98,'65 MB SIDE MOUNT TOP AND BOTTOM',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(99,'TOP AND BOTTOM DISTRIBUTION',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(100,'ΙΝΟΧΕ 220',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(101,'RESIN 220 ΝΑ',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(102,'SAND',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(103,'$13*54$ ORG VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(104,'$14*65$ ORG VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(105,'$16*65$ ORG VESSEL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(106,'25 MB AUTOMATIC MULTI FLOATVALVE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(107,'40 MB AUTOMATIC MULTI FLOATVALVE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(108,'4000 LPH HM SCALENOR',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(109,'10000 LPH HM SCALENOR',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(110,'CONTROL PANEL BIG',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(111,'CONTROL PANEL SMALL',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(112,'CONTROL PANEL SMPS',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(113,'HARDNESS BRAKER',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(114,'CONDITIONER',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(115,'REVERSE POLARITY',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(116,'SS SKID',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(117,'CONTROL PANEL BOX',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(118,'CONTROL PANEL STAND',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(119,'CONTROL PANEL WHITE',NULL,0.00,0.00,0,NULL,'RO System Components',NULL),(120,'100 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(121,'150 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(122,'200 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(123,'200 LPD PRESSURIZED SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(124,'250 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(125,'300 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(126,'300 LPD PRESSURIZED SPC SOLAR WATER Y',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(127,'500 LPD ETC SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(128,'500 LPD PRESSURIZED SPC SOLAR WATER HEATER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(129,'58*1800 SOLAR TUBE',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(130,'58*2100 SOLAR TUBE',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(131,'47*1800 SOLAR TUBE',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(132,'58 WACHERS',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(133,'47 WACHER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(134,'TUBE HOLDER\'S',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(135,'GASKET WACHER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(136,'DUMMY WACHER',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(137,'ALUMINIUM DUMMY',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(138,'COPER GASKET',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL),(139,'HOSE PIPE',NULL,0.00,0.00,0,NULL,'Solar Water Heaters',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
INSERT INTO `purchase_items` VALUES (1,1,1,10,0.00),(2,2,1,10,0.00),(3,3,1,10,0.00);
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) DEFAULT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (1,NULL,'2025-09-09 06:27:18',0.00),(2,NULL,'2025-09-09 06:28:29',0.00),(3,NULL,'2025-09-09 06:33:17',0.00);
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refunds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `refund_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `refund_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `taxable_amount` decimal(10,2) DEFAULT 0.00,
  `cgst_rate` decimal(5,2) DEFAULT 0.00,
  `sgst_rate` decimal(5,2) DEFAULT 0.00,
  `cgst_amount` decimal(10,2) DEFAULT 0.00,
  `sgst_amount` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(2,2,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(3,3,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(4,4,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(5,4,2,1,10.00,10.00,0.00,0.00,0.00,0.00),(6,4,3,1,0.00,0.00,0.00,0.00,0.00,0.00),(7,4,4,1,0.00,0.00,0.00,0.00,0.00,0.00),(8,4,8,1,0.00,0.00,0.00,0.00,0.00,0.00),(9,4,7,1,0.00,0.00,0.00,0.00,0.00,0.00),(10,4,6,1,0.00,0.00,0.00,0.00,0.00,0.00),(11,4,5,1,0.00,0.00,0.00,0.00,0.00,0.00),(12,4,9,1,0.00,0.00,0.00,0.00,0.00,0.00),(13,4,10,1,0.00,0.00,0.00,0.00,0.00,0.00),(14,4,11,1,0.00,0.00,0.00,0.00,0.00,0.00),(15,4,12,1,0.00,0.00,0.00,0.00,0.00,0.00),(16,4,16,1,0.00,0.00,0.00,0.00,0.00,0.00),(17,4,15,1,0.00,0.00,0.00,0.00,0.00,0.00),(18,4,14,1,0.00,0.00,0.00,0.00,0.00,0.00),(19,4,13,1,0.00,0.00,0.00,0.00,0.00,0.00),(20,4,17,1,0.00,0.00,0.00,0.00,0.00,0.00),(21,5,11,1,0.00,0.00,0.00,0.00,0.00,0.00),(22,5,19,1,0.00,0.00,0.00,0.00,0.00,0.00),(23,5,18,1,0.00,0.00,0.00,0.00,0.00,0.00),(24,5,17,1,0.00,0.00,0.00,0.00,0.00,0.00),(25,5,13,1,0.00,0.00,0.00,0.00,0.00,0.00),(26,5,14,1,0.00,0.00,0.00,0.00,0.00,0.00),(27,5,16,1,0.00,0.00,0.00,0.00,0.00,0.00),(28,5,12,1,0.00,0.00,0.00,0.00,0.00,0.00),(29,5,10,1,0.00,0.00,0.00,0.00,0.00,0.00),(30,5,9,1,0.00,0.00,0.00,0.00,0.00,0.00),(31,5,5,1,0.00,0.00,0.00,0.00,0.00,0.00),(32,6,6,3,0.00,0.00,0.00,0.00,0.00,0.00),(33,7,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(34,8,1,1,0.00,0.00,0.00,0.00,0.00,0.00),(35,8,2,1,0.00,0.00,0.00,0.00,0.00,0.00),(36,9,2,1,0.00,0.00,0.00,0.00,0.00,0.00),(37,9,3,1,0.00,0.00,0.00,0.00,0.00,0.00),(38,9,9,1,0.00,0.00,0.00,0.00,0.00,0.00),(39,9,7,1,0.00,0.00,0.00,0.00,0.00,0.00),(40,10,4,1,0.00,0.00,0.00,0.00,0.00,0.00),(41,10,3,1,0.00,0.00,0.00,0.00,0.00,0.00),(42,10,7,1,0.00,0.00,0.00,0.00,0.00,0.00),(43,10,11,1,0.00,0.00,0.00,0.00,0.00,0.00),(44,10,6,1,0.00,0.00,0.00,0.00,0.00,0.00),(45,10,5,1,0.00,0.00,0.00,0.00,0.00,0.00),(46,10,9,1,0.00,0.00,0.00,0.00,0.00,0.00),(47,10,10,1,0.00,0.00,0.00,0.00,0.00,0.00),(48,10,14,1,0.00,0.00,0.00,0.00,0.00,0.00);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `sale_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  `is_gst_customer` tinyint(1) DEFAULT 0,
  `total_taxable_amount` decimal(10,2) DEFAULT 0.00,
  `total_cgst` decimal(10,2) DEFAULT 0.00,
  `total_sgst` decimal(10,2) DEFAULT 0.00,
  `is_refunded` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,1,3,'2025-09-08 09:33:11',0.00,0,0.00,0.00,0.00,0),(2,1,3,'2025-09-08 09:36:01',0.00,0,0.00,0.00,0.00,0),(3,1,3,'2025-09-08 10:04:30',0.00,0,0.00,0.00,0.00,0),(4,1,3,'2025-09-08 10:57:02',10.00,0,10.00,0.00,0.00,0),(5,1,3,'2025-09-09 07:05:08',0.00,0,0.00,0.00,0.00,0),(6,1,4,'2025-09-11 11:25:22',0.00,0,0.00,0.00,0.00,0),(7,1,4,'2026-04-20 09:38:14',0.00,0,0.00,0.00,0.00,0),(8,1,4,'2026-04-20 10:01:36',0.00,0,0.00,0.00,0.00,0),(9,1,4,'2026-04-20 15:09:48',0.00,0,0.00,0.00,0.00,0),(10,1,5,'2026-08-19 07:54:40',0.00,0,0.00,0.00,0.00,0);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `reorder_quantity` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_google_tokens`
--

DROP TABLE IF EXISTS `user_google_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_google_tokens` (
  `user_id` int(11) NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_google_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_google_tokens`
--

LOCK TABLES `user_google_tokens` WRITE;
/*!40000 ALTER TABLE `user_google_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_google_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `permissions` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2y$10$NyBmoll5wjTjonWYrqzb9uTuZEn/8ADS0eUvQdCeE.nkG2Wf7aFwS','admin','Admin User',1,NULL),(2,'sales','$2a$12$mlSdDqaMCLt.Go4LfJhtl.OsYIwyink6NXLq/plF1yAjwkDQXOPbS','store_incharge','Store In-Charge',1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-19 19:13:57
