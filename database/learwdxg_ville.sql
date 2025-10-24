-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 24, 2025 at 11:51 AM
-- Server version: 11.4.8-MariaDB-cll-lve
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `learwdxg_ville`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_activities`
--

CREATE TABLE `tbl_activities` (
  `activity_id` int(11) NOT NULL,
  `advisory_id` int(11) NOT NULL,
  `quarter_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `activity_num` int(11) NOT NULL,
  `activity_name` varchar(100) NOT NULL,
  `activity_date` date NOT NULL,
  `activity_status` varchar(100) NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_activities`
--

INSERT INTO `tbl_activities` (`activity_id`, `advisory_id`, `quarter_id`, `subject_id`, `activity_num`, `activity_name`, `activity_date`, `activity_status`) VALUES
(1, 2, 1, 2, 1, 'Number Matching', '2025-08-04', 'Active'),
(2, 2, 1, 2, 2, 'Count 10 to 20', '2025-08-06', 'Active'),
(3, 2, 1, 5, 1, 'Learn to Dance', '2025-08-04', 'Active'),
(4, 2, 1, 2, 3, 'Number Line Jump', '2025-08-11', 'Active'),
(5, 2, 1, 2, 4, 'Number Puzzle Match', '2025-08-12', 'Active'),
(6, 2, 1, 4, 1, 'Write your name', '2025-08-10', 'Active'),
(7, 2, 1, 4, 2, 'Write your fav color', '2025-08-12', 'Active'),
(8, 2, 1, 4, 4, 'Identify the colors', '2025-08-13', 'Active'),
(9, 2, 1, 2, 6, 'Count 10 to 1', '2025-08-14', 'Active'),
(10, 2, 2, 2, 1, 'Arrange Cups by Height', '2025-10-06', 'Active'),
(11, 2, 1, 4, 3, 'Find the Letter on the Wall', '2025-08-12', 'Active'),
(12, 2, 1, 7, 1, 'Emotion Sorting Game', '2025-08-14', 'Active'),
(13, 2, 1, 6, 2, 'Play with Shadows and Light', '2025-08-14', 'Active'),
(14, 2, 1, 1, 1, 'Clean Up After Snack Time', '2025-08-14', 'Active'),
(15, 2, 1, 1, 4, 'Practice Greeting Others', '2025-09-30', 'Active'),
(16, 2, 1, 1, 3, 'Fix Bed After Nap Time', '2025-09-04', 'Active'),
(17, 2, 1, 2, 13, 'Find the Missing Shape', '2025-09-14', 'Active'),
(18, 2, 1, 2, 5, 'Sort by Texture', '2025-08-13', 'Active'),
(19, 2, 1, 4, 6, 'Match Letters to Pictures', '2025-08-27', 'Active'),
(20, 2, 1, 4, 8, 'Rhyming Words', '2025-09-22', 'Active'),
(21, 2, 1, 5, 4, 'Blanket Lift Game', '2025-09-17', 'Active'),
(22, 2, 1, 5, 3, 'Balloon Toss Game', '2025-08-23', 'Active'),
(23, 2, 1, 6, 4, 'Listen to Nature Sounds', '2025-09-05', 'Active'),
(24, 2, 1, 6, 1, 'Explore Sounds', '2025-08-11', 'Active'),
(25, 2, 1, 7, 4, 'Feelings Matching Chart', '2025-09-14', 'Active'),
(26, 2, 1, 7, 5, 'Kind Words Practice', '2025-09-20', 'Active'),
(27, 2, 2, 1, 1, 'Say “Sorry”', '2025-11-02', 'Active'),
(28, 2, 2, 1, 2, 'Say “Excuse Me”', '2025-11-04', 'Active'),
(29, 2, 2, 2, 5, 'Shape Hunt Around the Room', '2025-11-16', 'Active'),
(30, 2, 2, 2, 3, 'Count the Footsteps', '2025-10-24', 'Active'),
(31, 2, 2, 4, 1, 'Letter Sound Imitation', '2025-11-06', 'Active'),
(32, 2, 2, 4, 2, 'Alphabet Coloring Pages', '2025-11-30', 'Active'),
(33, 2, 2, 5, 1, 'Freeze Dance', '2025-10-07', 'Active'),
(34, 2, 2, 5, 2, 'Throw and Catch Beanbags', '2025-11-20', 'Active'),
(35, 2, 2, 6, 1, 'Observe Cloud Shapes', '2025-11-02', 'Active'),
(36, 2, 2, 6, 2, 'Group Animals by Habitat', '2025-11-26', 'Active'),
(37, 2, 2, 7, 1, 'Building Together with Blocks', '2025-10-06', 'Active'),
(38, 2, 2, 7, 2, 'Group Song and Dance Time', '2025-10-26', 'Active'),
(39, 2, 3, 1, 1, 'Identify Healthy and Unhealthy Foods', '2025-12-19', 'Active'),
(40, 2, 3, 1, 2, 'Choose Clothes for the Day', '2025-12-20', 'Active'),
(41, 2, 3, 2, 1, 'Rolling Dice Count and Match', '2025-12-21', 'Active'),
(42, 2, 3, 2, 2, 'Arrange Blocks from Small to Tall', '2025-12-23', 'Active'),
(43, 2, 3, 4, 1, 'Sort Letters by Shape', '2025-12-21', 'Active'),
(44, 2, 3, 4, 2, 'Describe What You See', '2026-02-07', 'Active'),
(45, 2, 3, 5, 1, 'Jump In and Out of a Hoop', '2025-12-12', 'Active'),
(46, 2, 3, 5, 2, 'Run and Stop Game', '2025-12-16', 'Active'),
(47, 2, 3, 6, 1, 'Compare Heavy and Light Objects', '2026-01-28', 'Active'),
(48, 2, 3, 6, 2, 'Count Seeds in a Fruit', '2026-01-30', 'Active'),
(49, 2, 3, 7, 1, 'Helping a Friend Pick Up Toys', '2025-12-09', 'Active'),
(50, 2, 3, 7, 2, 'Sharing Snack Time', '2025-12-10', 'Active'),
(51, 2, 4, 1, 1, 'Help Set the Table', '2026-03-01', 'Active'),
(52, 2, 4, 1, 2, 'Water the Plants', '2026-03-02', 'Active'),
(53, 2, 4, 2, 2, 'Button Counting Tray', '2026-02-26', 'Active'),
(54, 2, 4, 2, 3, 'Line Up by Size', '2026-02-28', 'Active'),
(55, 2, 4, 4, 1, 'Match Uppercase and Lowercase Letters', '2026-02-09', 'Active'),
(56, 2, 4, 4, 2, 'Listen to and Answer Simple Questions', '2026-02-10', 'Active'),
(57, 2, 4, 5, 1, 'Jump Over Lines or Ropes', '2026-03-20', 'Active'),
(58, 2, 4, 5, 2, 'March, Skip, and Hop Practice', '2026-03-22', 'Active'),
(59, 2, 4, 6, 1, 'Watch Insects in the Garden', '2026-02-26', 'Active'),
(60, 2, 4, 6, 2, 'Smell and Identify Scents', '2026-02-27', 'Active'),
(61, 2, 4, 7, 1, 'Feelings Puppet Show', '2026-02-26', 'Active'),
(62, 2, 4, 7, 2, 'Emotion Wheel', '2026-03-06', 'Active'),
(63, 2, 1, 7, 2, 'Helping Hands Activity', '2025-08-15', 'Active'),
(64, 2, 1, 7, 3, 'Smile Circle', '2025-08-16', 'Active'),
(65, 2, 1, 2, 8, 'Match the Shapes', '2025-08-16', 'Active'),
(66, 2, 1, 2, 9, 'Number Blocks Tower', '2025-08-17', 'Active'),
(67, 2, 1, 2, 10, 'Color and Count Cups', '2025-08-18', 'Active'),
(68, 2, 1, 2, 11, 'Count the Steps', '2025-08-20', 'Active'),
(69, 2, 1, 1, 2, 'Pack and Unpack Toy Box', '2025-08-16', 'Active'),
(70, 2, 1, 5, 2, 'Obstacle Course', '2025-08-16', 'Active'),
(71, 2, 1, 6, 3, 'Ice Melting Race', '2025-08-16', 'Active'),
(72, 2, 1, 2, 7, 'Group the Toys by Kind', '2025-08-15', 'Active'),
(73, 2, 2, 2, 4, 'Count the Fruit Pieces', '2025-10-26', 'Active'),
(74, 2, 1, 4, 7, 'Circle the First Letter of Your Name', '2025-09-21', 'Active'),
(75, 2, 4, 7, 3, 'My Favorite Things Sharing Time', '2026-03-07', 'Active'),
(76, 3, 1, 2, 1, 'Build and Measure', '2025-08-04', 'Active'),
(77, 3, 1, 1, 1, 'Prepare a Simple Snack', '2025-08-06', 'Active'),
(78, 3, 1, 1, 2, 'Button and Zip Practice', '2025-08-07', 'Active'),
(79, 3, 1, 2, 2, 'Size Order Blocks', '2025-08-08', 'Active'),
(80, 3, 1, 2, 3, 'Cup Stack Numbers', '2025-08-09', 'Active'),
(81, 3, 1, 3, 1, 'Araw ng Alpabeto', '2025-08-10', 'Active'),
(82, 3, 1, 3, 2, 'Salitang Magkasalungat', '2025-08-11', 'Active'),
(83, 3, 1, 4, 1, 'Trace and Write Own Name', '2025-08-12', 'Active'),
(84, 3, 1, 4, 2, 'Letter Tracing in Sand', '2025-08-13', 'Active'),
(85, 3, 1, 5, 1, 'Simon Says Movement Game', '2025-08-14', 'Active'),
(86, 3, 1, 5, 2, 'Group Circle Dance', '2025-08-15', 'Active'),
(87, 3, 1, 6, 1, 'Discuss Day and Night Differences', '2025-08-16', 'Active'),
(88, 3, 1, 6, 2, 'Classify Living and Non-Living Things', '2025-08-17', 'Active'),
(89, 3, 1, 7, 1, 'My Calm Box', '2025-08-18', 'Active'),
(90, 3, 1, 7, 2, 'Talk About Fairness', '2025-08-19', 'Active'),
(91, 3, 2, 1, 1, 'Share Toys and Take Turns', '2025-10-08', 'Active'),
(92, 3, 2, 1, 2, 'Fold Small Towels or Clothes', '2025-10-09', 'Active'),
(93, 3, 2, 2, 1, 'Hop on the Number', '2025-10-10', 'Active'),
(94, 3, 2, 2, 2, 'Count the Crayons', '2025-10-11', 'Active'),
(95, 3, 2, 3, 1, 'Pagtukoy ng Kulay', '2025-10-12', 'Active'),
(96, 3, 2, 3, 2, 'Pagbuo ng Salita', '2025-10-13', 'Active'),
(97, 3, 2, 4, 1, 'Draw Favorite Things', '2025-10-14', 'Active'),
(98, 3, 2, 4, 2, 'Label Favorite Things', '2025-10-15', 'Active'),
(99, 3, 2, 5, 1, 'Balance Beam Walk', '2025-10-16', 'Active'),
(100, 3, 2, 5, 2, 'Hula Hoop Challenge', '2025-10-17', 'Active'),
(101, 3, 2, 6, 1, 'Explore the Five Senses Activity', '2025-10-18', 'Active'),
(102, 3, 2, 6, 2, 'Sort Materials: Wood, Metal, Plastic', '2025-10-19', 'Active'),
(103, 3, 2, 7, 1, 'Calm Corner Routine', '2025-10-20', 'Active'),
(104, 3, 2, 7, 2, 'Making Apologies Practice', '2025-10-21', 'Active'),
(105, 3, 3, 1, 1, 'Organize School Things', '2025-12-10', 'Active'),
(106, 3, 3, 1, 2, 'Practice Saying “Please Help”', '2025-12-11', 'Active'),
(107, 3, 3, 2, 1, 'Rolling Dice Count', '2025-12-12', 'Active'),
(108, 3, 3, 2, 2, 'Match Numbers on Wall Cards', '2025-12-13', 'Active'),
(109, 3, 3, 3, 1, 'Pumili ng Malaki o Maliit', '2025-12-14', 'Active'),
(110, 3, 3, 3, 2, 'Bilangin ang mga Laruan', '2025-12-15', 'Active'),
(111, 3, 3, 4, 1, 'Match Letter to Beginning Sound', '2025-12-16', 'Active'),
(112, 3, 3, 4, 2, 'Identify Letters in Environmental Print', '2025-12-17', 'Active'),
(113, 3, 3, 5, 1, 'Animal Movement Race', '2025-12-18', 'Active'),
(114, 3, 3, 5, 2, 'Run and Pass the Ball', '2025-12-19', 'Active'),
(115, 3, 3, 6, 1, 'Weather Observation Diary', '2025-12-20', 'Active'),
(116, 3, 3, 6, 2, 'Match Animals to Their Homes', '2025-12-21', 'Active'),
(117, 3, 3, 7, 1, 'Cooperation Puzzle Challenge', '2025-12-22', 'Active'),
(118, 3, 3, 7, 2, 'Talk About “What Makes Me Happy/Sad”', '2025-12-23', 'Active'),
(119, 3, 4, 1, 1, 'Choose and Pack Snacks for School', '2026-02-11', 'Active'),
(120, 3, 4, 1, 2, 'Help a Friend Tie Shoelaces', '2026-02-12', 'Active'),
(121, 3, 4, 2, 1, 'Find the Missing Number', '2026-02-13', 'Active'),
(122, 3, 4, 2, 2, 'Number Song Dance', '2026-02-14', 'Active'),
(123, 3, 4, 3, 1, 'Awit Bayanihan', '2026-02-15', 'Active'),
(124, 3, 4, 3, 2, 'Pagbati at Pamamaraan', '2026-02-16', 'Active'),
(125, 3, 4, 4, 1, 'Build Simple Words', '2026-02-17', 'Active'),
(126, 3, 4, 4, 2, 'Sound Hunt', '2026-02-18', 'Active'),
(127, 3, 4, 5, 1, 'Hopscotch', '2026-02-19', 'Active'),
(128, 3, 4, 5, 2, 'Jump Rope', '2026-02-20', 'Active'),
(129, 3, 4, 6, 1, 'Sink or Float Experiment', '2026-02-21', 'Active'),
(130, 3, 4, 6, 2, 'Count Seeds in a Fruit', '2026-02-22', 'Active'),
(131, 3, 4, 7, 1, 'Helping Hands Chart', '2026-02-23', 'Active'),
(132, 3, 4, 7, 2, 'Empathy Role Play', '2026-02-24', 'Active'),
(133, 1, 1, 1, 1, 'Follow Simple Directions', '2025-08-06', 'Active'),
(134, 1, 1, 1, 2, 'Throw Trash in the Bin', '2025-08-07', 'Active'),
(135, 1, 1, 2, 1, 'Count and Clap', '2025-08-08', 'Active'),
(136, 1, 1, 2, 2, 'Color and Count Cups', '2025-08-09', 'Active'),
(137, 1, 1, 4, 1, 'Sing the Alphabet Song', '2025-08-12', 'Active'),
(138, 1, 1, 4, 2, 'Point to Body Parts', '2025-08-13', 'Active'),
(139, 1, 1, 5, 1, 'Reach and Touch Game', '2025-08-14', 'Active'),
(140, 1, 1, 5, 2, 'March to Music', '2025-08-15', 'Active'),
(141, 1, 1, 6, 1, 'Water Play (pouring)', '2025-08-16', 'Active'),
(142, 1, 1, 6, 2, 'Water Play (scooping)', '2025-08-17', 'Active'),
(143, 1, 1, 7, 1, 'Thank You Practice', '2025-08-18', 'Active'),
(144, 1, 1, 7, 2, 'Simple Sharing Circle', '2025-08-19', 'Active'),
(145, 1, 2, 1, 1, 'Practice Saying “Please”', '2025-10-08', 'Active'),
(146, 1, 2, 1, 2, 'Practice Saying “Thank You”', '2025-10-09', 'Active'),
(147, 1, 2, 2, 1, 'Stack and Count Rings', '2025-10-10', 'Active'),
(148, 1, 2, 2, 2, 'Big and Small Hunt', '2025-10-11', 'Active'),
(149, 1, 2, 4, 1, 'Name the Object', '2025-10-14', 'Active'),
(150, 1, 2, 4, 2, 'Picture Book Time', '2025-10-15', 'Active'),
(151, 1, 2, 5, 1, 'Simple Dance Movements', '2025-10-16', 'Active'),
(152, 1, 2, 5, 2, 'Animal Walks', '2025-10-17', 'Active'),
(153, 1, 2, 6, 1, 'Touch and Feel Textures', '2025-10-18', 'Active'),
(154, 1, 2, 6, 2, 'Watch Ice Melt', '2025-10-19', 'Active'),
(155, 1, 2, 7, 1, 'Name That Feeling', '2025-10-20', 'Active'),
(156, 1, 2, 7, 2, 'Smile Exchange', '2025-10-21', 'Active'),
(157, 1, 3, 1, 1, 'Wash Hands', '2025-12-10', 'Active'),
(158, 1, 3, 1, 2, 'Eat Using Spoon', '2025-12-11', 'Active'),
(159, 1, 3, 2, 1, 'Sort the Blocks by Color', '2025-12-12', 'Active'),
(160, 1, 3, 2, 2, 'Match the Same Shape', '2025-12-13', 'Active'),
(161, 1, 3, 4, 1, 'Say My Name', '2025-12-16', 'Active'),
(162, 1, 3, 4, 2, 'Repeat Simple Words', '2025-12-17', 'Active'),
(163, 1, 3, 5, 1, 'Jump Over a Pillow', '2025-12-18', 'Active'),
(164, 1, 3, 5, 2, 'Bubble Popping Game', '2025-12-19', 'Active'),
(165, 1, 3, 6, 1, 'Float and Sink Play', '2025-12-20', 'Active'),
(166, 1, 3, 6, 2, 'Sorting Natural Objects (leaves, stones)', '2025-12-21', 'Active'),
(167, 1, 3, 7, 1, 'Peek-a-Boo Social Play', '2025-12-22', 'Active'),
(168, 1, 3, 7, 2, 'Sing “If You’re Happy and You Know It”', '2025-12-23', 'Active'),
(169, 1, 4, 1, 1, 'Help Carry Small Items', '2026-02-11', 'Active'),
(170, 1, 4, 1, 2, 'Put Dirty Clothes in Laundry Basket', '2026-02-12', 'Active'),
(171, 1, 4, 2, 1, 'Shape Sorting Basket', '2026-02-13', 'Active'),
(172, 1, 4, 2, 2, 'Roll and Count Balls', '2026-02-14', 'Active'),
(173, 1, 4, 4, 1, 'Listen and Repeat Rhymes', '2026-02-17', 'Active'),
(174, 1, 4, 4, 2, 'Color Naming Game', '2026-02-18', 'Active'),
(175, 1, 4, 5, 1, 'Kick the Ball', '2026-02-19', 'Active'),
(176, 1, 4, 5, 2, 'Catch the Balloon', '2026-02-20', 'Active'),
(177, 1, 4, 6, 1, 'Mix Colors with Finger Paints', '2026-02-21', 'Active'),
(178, 1, 4, 6, 2, 'Smell the Flowers', '2026-02-22', 'Active'),
(179, 1, 4, 7, 1, 'Identify happy, sad and angry', '2026-02-23', 'Active'),
(180, 1, 4, 7, 2, 'Hug a Friend Activity', '2026-02-24', 'Active'),
(181, 2, 1, 1, 5, 'Help Feed a Pet', '2025-10-02', 'Active'),
(182, 2, 1, 5, 5, 'Balance on One Foot', '2025-09-20', 'Active'),
(183, 2, 4, 2, 1, 'Pattern Beads Play', '2026-02-19', 'Active'),
(184, 2, 1, 2, 12, 'Draw and Count Circles', '2025-08-21', 'Active'),
(185, 2, 1, 4, 5, 'Alphabet Treasure Hunt', '2025-08-21', 'Active'),
(186, 2, 2, 2, 2, 'Shape Stamp Art', '2025-10-20', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_add_info`
--

CREATE TABLE `tbl_add_info` (
  `add_info_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `city_municipality` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `tin_number` varchar(50) DEFAULT NULL,
  `sss_number` varchar(50) DEFAULT NULL,
  `pagibig_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_add_info`
--

INSERT INTO `tbl_add_info` (`add_info_id`, `user_id`, `barangay`, `city_municipality`, `province`, `country`, `tin_number`, `sss_number`, `pagibig_number`) VALUES
(1, 1, 'Opol ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '123-456-789', '01-2345678-9', '1234-5678-9012'),
(2, 2, 'Kauswagan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '234-567-890', '02-3456789-0', '2345-6789-1111'),
(3, 3, 'Lapasan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '345-678-901', '03-4567890-1', '3456-7890-1234'),
(4, 4, 'Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '456-789-012', '01-5678901-1', '4567-8901-2345'),
(5, 5, 'Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '567-890-444', '05-6789012-4', '5678-9012-4444'),
(6, 9, 'Bulua', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '678-901-234', '06-7890123-4', '6789-0123-4567'),
(7, 10, 'Bulua', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '789-012-345', '07-8901234-5', '7890-1234-5678'),
(8, 11, 'Lapasan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '890-123-456', '08-9012345-6', '8901-2345-6789'),
(9, 13, 'Lapasan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '', '', ''),
(10, 14, 'Kauswagan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '222-845-457-867', '53-3454435-1', '8901-2345-5768'),
(11, 15, 'Westwoods', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '757-575-754-755', '33-3332246-5', '3646-6342-5225'),
(12, 16, 'Barangay 7 ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '123-456-789-000', '34-5678901-2', '2222-2222-2224'),
(13, 17, 'Barangay 4 ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '', '', ''),
(14, 19, 'Opol', 'Cagayan de Oro', 'Misamis Oriental', 'Philippines', '223-764-564-553', '56-7657576-7', '4465-5756-7683'),
(15, 22, 'Carmen ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '686-856-757-447', '53-3454435-3', '4645-6646-5465'),
(16, 23, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '222-845-457-333', '53-3454435-2', '8901-2345-8563'),
(17, 27, 'Barangay 8', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '343-335-645-565', '34-3737747-5', '6743-4664-7642'),
(18, 35, 'Barangay 4', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '111-111-111-221', '22-2222222-2', '2222-2222-2222'),
(19, 36, 'Barangay 4', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '', '', ''),
(20, 38, 'Barangay 4', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '', '', ''),
(21, 40, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '222-845-457-222', '75-5756464-7', '4664-6453-3535'),
(22, 42, 'Opol', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines', '', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_advisory`
--

CREATE TABLE `tbl_advisory` (
  `advisory_id` int(11) NOT NULL,
  `level_id` int(11) DEFAULT NULL,
  `lead_teacher_id` int(11) NOT NULL,
  `assistant_teacher_id` int(11) DEFAULT NULL,
  `total_male` int(11) DEFAULT 0,
  `total_female` int(11) DEFAULT 0,
  `total_students` int(11) GENERATED ALWAYS AS (`total_male` + `total_female`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_advisory`
--

INSERT INTO `tbl_advisory` (`advisory_id`, `level_id`, `lead_teacher_id`, `assistant_teacher_id`, `total_male`, `total_female`) VALUES
(1, 1, 27, 9, 4, 3),
(2, 2, 5, 10, 2, 6),
(3, 3, 19, 22, 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_attendance`
--

CREATE TABLE `tbl_attendance` (
  `attendance_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `recorded_by` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `attendance_status` enum('Present','Absent') NOT NULL DEFAULT 'Absent',
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_attendance`
--

INSERT INTO `tbl_attendance` (`attendance_id`, `student_id`, `recorded_by`, `attendance_date`, `attendance_status`, `recorded_at`) VALUES
(8, 3, 5, '2025-08-04', 'Present', '2025-08-06 09:49:53'),
(9, 6, 5, '2025-08-04', 'Present', '2025-08-10 12:31:44'),
(10, 8, 5, '2025-08-04', 'Present', '2025-08-10 12:31:44'),
(11, 3, 5, '2025-08-06', 'Present', '2025-08-06 09:49:57'),
(12, 6, 5, '2025-08-06', 'Present', '2025-08-10 12:31:51'),
(13, 8, 5, '2025-08-06', 'Present', '2025-08-10 12:31:51'),
(14, 7, 5, '2025-08-04', 'Present', '2025-08-06 09:49:53'),
(15, 7, 5, '2025-08-06', 'Present', '2025-08-06 09:49:57'),
(16, 3, 5, '2025-08-08', 'Present', '2025-07-13 14:11:58'),
(17, 6, 5, '2025-08-08', 'Present', '2025-08-10 12:31:56'),
(18, 8, 5, '2025-08-08', 'Present', '2025-08-10 12:31:56'),
(19, 6, 5, '2025-08-07', 'Present', '2025-08-10 12:31:53'),
(20, 8, 5, '2025-08-07', 'Present', '2025-08-10 12:31:53'),
(21, 6, 5, '2025-08-05', 'Present', '2025-08-10 12:31:48'),
(22, 8, 5, '2025-08-05', 'Absent', '2025-08-10 12:31:48'),
(23, 11, 5, '2025-08-05', 'Present', '2025-08-06 09:50:00'),
(24, 11, 5, '2025-08-07', 'Present', '2025-07-17 14:36:43'),
(25, 11, 5, '2025-08-06', 'Present', '2025-08-06 09:49:57'),
(26, 3, 5, '2025-08-07', 'Present', '2025-08-10 12:31:53'),
(27, 7, 5, '2025-08-07', 'Present', '2025-07-17 14:37:02'),
(28, 12, 5, '2025-08-07', 'Present', '2025-07-17 14:37:02'),
(29, 3, 5, '2025-08-04', 'Present', '2025-08-10 12:31:44'),
(30, 12, 5, '2025-08-04', 'Present', '2025-08-06 09:49:53'),
(31, 11, 5, '2025-08-04', 'Present', '2025-08-06 09:49:53'),
(32, 11, 5, '2025-08-08', 'Present', '2025-08-06 09:50:04'),
(33, 3, 5, '2025-08-06', 'Present', '2025-08-10 12:31:51'),
(34, 12, 5, '2025-08-06', 'Present', '2025-08-06 09:49:57'),
(35, 3, 5, '2025-08-05', 'Present', '2025-08-10 12:31:48'),
(36, 7, 5, '2025-08-05', 'Present', '2025-08-06 09:50:00'),
(37, 12, 5, '2025-08-05', 'Present', '2025-08-06 09:50:00'),
(38, 3, 5, '2025-08-08', 'Present', '2025-08-10 12:31:56'),
(39, 7, 5, '2025-08-08', 'Present', '2025-08-06 09:50:04'),
(40, 12, 5, '2025-08-08', 'Present', '2025-08-06 09:50:04'),
(41, 6, 10, '2025-08-09', 'Present', '2025-08-10 12:36:14'),
(42, 8, 10, '2025-08-09', 'Present', '2025-08-10 12:36:14'),
(43, 11, 10, '2025-08-09', 'Present', '2025-08-06 09:50:08'),
(44, 5, 19, '2025-08-04', 'Present', '2025-07-30 12:15:11'),
(45, 4, 19, '2025-08-04', 'Present', '2025-07-30 12:16:12'),
(46, 9, 19, '2025-08-04', 'Absent', '2025-07-30 12:16:12'),
(47, 5, 19, '2025-08-05', 'Present', '2025-07-30 12:20:09'),
(48, 4, 19, '2025-08-05', 'Present', '2025-07-30 12:20:23'),
(49, 9, 19, '2025-08-05', 'Present', '2025-07-30 12:20:23'),
(50, 1, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:49'),
(51, 2, 27, '2025-08-04', 'Present', '2025-08-30 17:37:49'),
(52, 3, 5, '2025-08-09', 'Present', '2025-08-10 12:36:14'),
(53, 7, 5, '2025-08-09', 'Present', '2025-08-06 09:50:08'),
(54, 12, 5, '2025-08-09', 'Present', '2025-08-06 09:50:08'),
(55, 6, 5, '2025-10-07', 'Present', '2025-08-10 10:24:25'),
(56, 8, 5, '2025-10-07', 'Absent', '2025-08-10 10:24:25'),
(57, 11, 5, '2025-10-07', 'Absent', '2025-08-10 10:24:25'),
(58, 3, 5, '2025-10-07', 'Present', '2025-08-06 10:07:09'),
(59, 7, 5, '2025-10-07', 'Present', '2025-08-06 10:07:09'),
(60, 12, 5, '2025-10-07', 'Absent', '2025-08-06 10:07:09'),
(61, 6, 5, '2025-08-11', 'Present', '2025-08-10 12:36:13'),
(62, 8, 5, '2025-08-11', 'Present', '2025-08-10 12:36:13'),
(63, 11, 5, '2025-08-11', 'Present', '2025-08-06 10:07:56'),
(64, 3, 5, '2025-08-11', 'Present', '2025-08-06 10:07:56'),
(65, 7, 5, '2025-08-11', 'Present', '2025-08-06 10:07:56'),
(66, 12, 5, '2025-08-11', 'Absent', '2025-08-06 10:07:32'),
(67, 3, 5, '2025-08-11', 'Present', '2025-08-06 10:07:37'),
(68, 7, 5, '2025-08-11', 'Present', '2025-08-06 10:07:37'),
(69, 12, 5, '2025-08-11', 'Present', '2025-08-06 10:07:37'),
(70, 3, 5, '2025-08-11', 'Present', '2025-08-06 10:07:41'),
(71, 7, 5, '2025-08-11', 'Present', '2025-08-06 10:07:41'),
(72, 12, 5, '2025-08-11', 'Present', '2025-08-06 10:07:41'),
(73, 3, 5, '2025-08-11', 'Present', '2025-08-10 12:36:13'),
(74, 7, 5, '2025-08-11', 'Present', '2025-08-06 10:07:46'),
(75, 12, 5, '2025-08-11', 'Present', '2025-08-06 10:07:56'),
(76, 6, 5, '2025-12-10', 'Present', '2025-08-10 10:23:30'),
(77, 8, 5, '2025-12-10', 'Present', '2025-08-10 10:23:30'),
(78, 11, 5, '2025-12-10', 'Present', '2025-08-10 10:23:30'),
(79, 3, 5, '2025-12-10', 'Absent', '2025-08-06 10:10:38'),
(80, 7, 5, '2025-12-10', 'Absent', '2025-08-06 10:10:38'),
(81, 12, 5, '2025-12-10', 'Present', '2025-08-06 10:10:38'),
(82, 6, 5, '2026-02-10', 'Present', '2025-08-10 12:45:30'),
(83, 8, 5, '2026-02-10', 'Absent', '2025-08-10 12:45:30'),
(84, 11, 5, '2026-02-10', 'Absent', '2025-08-10 10:23:32'),
(85, 3, 5, '2026-02-10', 'Present', '2025-08-10 12:45:30'),
(86, 7, 5, '2026-02-10', 'Absent', '2025-08-06 10:11:08'),
(87, 12, 5, '2026-02-10', 'Present', '2025-08-06 10:11:08'),
(88, 5, 19, '2025-10-08', 'Present', '2025-08-06 10:29:08'),
(89, 4, 19, '2025-10-08', 'Absent', '2025-08-06 10:29:08'),
(90, 9, 19, '2025-10-08', 'Present', '2025-08-06 10:29:09'),
(91, 5, 19, '2026-02-10', 'Present', '2025-08-06 10:31:37'),
(92, 5, 19, '2025-08-06', 'Absent', '2025-08-06 10:35:46'),
(93, 5, 19, '2025-08-07', 'Present', '2025-08-06 11:02:18'),
(94, 4, 19, '2025-08-06', 'Present', '2025-08-06 11:02:26'),
(95, 9, 19, '2025-08-06', 'Absent', '2025-08-06 11:02:26'),
(96, 4, 19, '2025-08-07', 'Present', '2025-08-06 11:02:30'),
(97, 9, 19, '2025-08-07', 'Present', '2025-08-06 11:02:30'),
(98, 4, 19, '2026-02-10', 'Present', '2025-08-06 11:02:34'),
(99, 9, 19, '2026-02-10', 'Present', '2025-08-06 11:02:34'),
(100, 5, 19, '2025-12-08', 'Present', '2025-08-06 11:02:59'),
(101, 4, 19, '2025-12-08', 'Present', '2025-08-06 11:03:06'),
(102, 9, 19, '2025-12-08', 'Absent', '2025-08-06 11:03:06'),
(103, 6, 5, '2025-08-12', 'Present', '2025-08-10 12:36:11'),
(104, 8, 5, '2025-08-12', 'Present', '2025-08-10 12:36:11'),
(105, 11, 5, '2025-08-12', 'Absent', '2025-08-08 11:13:47'),
(106, 13, 5, '2025-08-12', 'Present', '2025-08-10 12:36:11'),
(107, 6, 5, '2025-08-14', 'Present', '2025-08-10 12:36:10'),
(108, 8, 5, '2025-08-14', 'Present', '2025-08-10 12:36:10'),
(109, 11, 5, '2025-08-14', 'Absent', '2025-08-10 10:17:37'),
(110, 13, 5, '2025-08-14', 'Present', '2025-08-10 12:36:10'),
(111, 6, 5, '2025-10-08', 'Present', '2025-08-10 12:36:06'),
(112, 8, 5, '2025-10-08', 'Absent', '2025-08-10 12:36:06'),
(113, 11, 5, '2025-10-08', 'Present', '2025-08-10 12:45:25'),
(114, 13, 5, '2025-10-08', 'Present', '2025-08-10 12:36:06'),
(115, 13, 5, '2025-12-10', 'Present', '2025-08-10 10:23:30'),
(116, 13, 5, '2026-02-10', 'Present', '2025-08-10 12:45:30'),
(117, 13, 5, '2025-10-07', 'Present', '2025-08-10 10:24:25'),
(118, 13, 5, '2025-08-04', 'Present', '2025-08-10 12:31:44'),
(119, 13, 5, '2025-08-05', 'Present', '2025-08-10 12:31:48'),
(120, 13, 5, '2025-08-06', 'Present', '2025-08-10 12:31:51'),
(121, 13, 5, '2025-08-07', 'Present', '2025-08-10 12:31:53'),
(122, 13, 5, '2025-08-08', 'Present', '2025-08-10 12:31:56'),
(123, 3, 5, '2025-12-11', 'Present', '2025-08-10 12:32:20'),
(124, 6, 5, '2025-12-11', 'Present', '2025-08-10 12:32:20'),
(125, 8, 5, '2025-12-11', 'Present', '2025-08-10 12:32:20'),
(126, 13, 5, '2025-12-11', 'Present', '2025-08-10 12:32:20'),
(127, 7, 5, '2025-12-11', 'Absent', '2025-08-10 12:33:14'),
(128, 11, 5, '2025-12-11', 'Present', '2025-08-10 12:33:14'),
(129, 12, 5, '2025-12-11', 'Absent', '2025-08-10 12:33:14'),
(130, 3, 5, '2025-10-08', 'Present', '2025-08-10 12:36:06'),
(131, 3, 5, '2025-08-14', 'Absent', '2025-08-10 12:36:10'),
(132, 3, 5, '2025-08-12', 'Absent', '2025-08-10 12:36:11'),
(133, 13, 5, '2025-08-11', 'Absent', '2025-08-10 12:36:13'),
(134, 13, 5, '2025-08-09', 'Absent', '2025-08-10 12:36:14'),
(135, 3, 5, '2026-02-11', 'Present', '2025-08-10 12:45:08'),
(136, 6, 5, '2026-02-11', 'Present', '2025-08-10 12:45:08'),
(137, 8, 5, '2026-02-11', 'Absent', '2025-08-10 12:45:08'),
(138, 13, 5, '2026-02-11', 'Present', '2025-08-10 12:45:08'),
(139, 7, 5, '2026-02-11', 'Present', '2025-08-10 12:45:20'),
(140, 11, 5, '2026-02-11', 'Present', '2025-08-10 12:45:20'),
(141, 12, 5, '2026-02-11', 'Present', '2025-08-10 12:45:20'),
(142, 7, 5, '2025-10-08', 'Absent', '2025-08-10 12:45:25'),
(143, 12, 5, '2025-10-08', 'Absent', '2025-08-10 12:45:25'),
(144, 7, 5, '2026-02-12', 'Present', '2025-09-04 13:03:52'),
(145, 11, 5, '2026-02-12', 'Present', '2025-09-04 13:03:52'),
(146, 12, 5, '2026-02-12', 'Present', '2025-09-04 13:03:52'),
(147, 3, 5, '2026-02-12', 'Present', '2025-09-04 13:03:52'),
(148, 8, 5, '2026-02-12', 'Absent', '2025-09-04 13:03:52'),
(149, 13, 5, '2026-02-12', 'Absent', '2025-09-04 13:03:52'),
(150, 1, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(151, 2, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(152, 14, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(153, 15, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(154, 16, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(155, 17, 27, '2025-08-06', 'Present', '2025-08-30 17:37:19'),
(156, 14, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:49'),
(157, 15, 27, '2025-08-04', 'Present', '2025-08-30 17:37:49'),
(158, 16, 27, '2025-08-04', 'Present', '2025-08-30 17:37:49'),
(159, 17, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:26'),
(160, 14, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:29'),
(161, 15, 27, '2025-08-04', 'Present', '2025-08-30 17:37:29'),
(162, 16, 27, '2025-08-04', 'Present', '2025-08-30 17:37:29'),
(163, 17, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:49'),
(164, 14, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:36'),
(165, 15, 27, '2025-08-04', 'Present', '2025-08-30 17:37:36'),
(166, 16, 27, '2025-08-04', 'Present', '2025-08-30 17:37:36'),
(167, 17, 27, '2025-08-04', 'Absent', '2025-08-30 17:37:36'),
(168, 1, 27, '2025-10-08', 'Absent', '2025-08-30 17:39:28'),
(169, 2, 27, '2025-10-08', 'Present', '2025-08-30 17:39:28'),
(170, 14, 27, '2025-10-08', 'Absent', '2025-08-30 17:39:28'),
(171, 15, 27, '2025-10-08', 'Present', '2025-08-30 17:39:28'),
(172, 16, 27, '2025-10-08', 'Present', '2025-08-30 17:39:28'),
(173, 17, 27, '2025-10-08', 'Present', '2025-08-30 17:39:28'),
(174, 1, 27, '2025-12-12', 'Present', '2025-08-30 17:39:59'),
(175, 2, 27, '2025-12-12', 'Absent', '2025-08-30 17:39:59'),
(176, 14, 27, '2025-12-12', 'Present', '2025-08-30 17:39:59'),
(177, 15, 27, '2025-12-12', 'Present', '2025-08-30 17:39:59'),
(178, 16, 27, '2025-12-12', 'Absent', '2025-08-30 17:40:00'),
(179, 17, 27, '2025-12-12', 'Present', '2025-08-30 17:40:00'),
(180, 1, 27, '2026-02-14', 'Present', '2025-08-30 17:40:46'),
(181, 2, 27, '2026-02-14', 'Present', '2025-08-30 17:40:46'),
(182, 14, 27, '2026-02-14', 'Present', '2025-08-30 17:40:46'),
(183, 15, 27, '2026-02-14', 'Present', '2025-08-30 17:40:46'),
(184, 16, 27, '2026-02-14', 'Present', '2025-08-30 17:40:46'),
(185, 17, 27, '2026-02-14', 'Absent', '2025-08-30 17:40:46'),
(186, 6, 5, '2026-02-12', 'Absent', '2025-09-04 13:03:52'),
(187, 6, 5, '2025-10-15', 'Present', '2025-10-14 16:37:50'),
(188, 8, 5, '2025-10-15', 'Present', '2025-10-14 16:37:50'),
(189, 11, 5, '2025-10-15', 'Absent', '2025-10-14 16:37:50'),
(190, 13, 5, '2025-10-15', 'Absent', '2025-10-14 16:37:50');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_communication`
--

CREATE TABLE `tbl_communication` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_edited` tinyint(1) NOT NULL DEFAULT 0,
  `is_unsent` tinyint(1) NOT NULL DEFAULT 0,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_communication`
--

INSERT INTO `tbl_communication` (`message_id`, `sender_id`, `receiver_id`, `message_text`, `is_read`, `sent_at`, `is_edited`, `is_unsent`, `is_archived`) VALUES
(1, 1, 4, 'halo', 0, '2025-08-17 13:24:25', 0, 0, 0),
(2, 1, 15, 'meeting toms edited', 0, '2025-08-17 13:29:36', 0, 0, 0),
(3, 1, 22, 'meeting', 0, '2025-08-17 13:33:10', 0, 1, 1),
(4, 1, 15, 'new\n\n\n\nfffgfg hahhaayt', 0, '2025-08-17 13:49:25', 0, 0, 0),
(5, 1, 15, 'vcvcccvcv\nfgfgfgfgfgfgfgfgfg\n\n\ndfdfdf \n\nhalo', 0, '2025-08-17 14:06:46', 0, 0, 0),
(6, 1, 15, 'sddsdssd', 0, '2025-08-17 14:06:53', 0, 0, 0),
(7, 1, 22, 'from the window', 0, '2025-08-17 15:34:51', 0, 0, 1),
(8, 1, 22, 'like a bird', 0, '2025-08-17 15:34:57', 0, 0, 1),
(9, 1, 4, 'new message', 0, '2025-08-17 16:00:50', 0, 1, 0),
(10, 1, 4, 'nbew', 0, '2025-08-17 16:01:22', 0, 0, 0),
(11, 1, 4, 'sddsds', 0, '2025-08-17 16:04:55', 0, 1, 0),
(12, 1, 23, 'wow', 1, '2025-08-17 16:05:44', 0, 0, 0),
(13, 1, 15, 'Let\'s review reports tomorrow.', 0, '2025-08-17 16:19:59', 0, 0, 0),
(14, 5, 23, 'We noticed great improvement this week!', 1, '2025-08-17 17:06:52', 0, 0, 0),
(15, 1, 22, 'Thanks for your hard work!', 0, '2025-08-17 17:07:02', 0, 1, 1),
(16, 1, 15, 'Schedule the system backup.', 0, '2025-08-17 17:07:15', 0, 0, 0),
(17, 1, 23, 'Edited Please sign the consent form sent today.', 1, '2025-08-17 17:07:18', 1, 0, 0),
(18, 1, 15, 'k df', 0, '2025-08-17 17:26:35', 1, 0, 0),
(19, 5, 23, 'l', 1, '2025-08-17 17:30:22', 0, 1, 0),
(20, 5, 23, 'dfdffd', 1, '2025-08-17 17:33:10', 0, 1, 0),
(21, 1, 23, 'hgghg', 1, '2025-08-17 17:33:46', 0, 1, 0),
(22, 1, 23, 'Thank you for reaching out.', 1, '2025-08-17 17:36:04', 0, 1, 0),
(23, 5, 23, 'lllll', 1, '2025-08-17 17:36:25', 0, 1, 0),
(24, 1, 23, 'Here\'s your child\'s progress update.', 1, '2025-08-17 17:44:11', 0, 1, 0),
(25, 1, 23, 'llssssl', 1, '2025-08-17 17:44:25', 1, 1, 0),
(26, 1, 23, 'We noticed great improvement this week!', 1, '2025-08-17 17:48:55', 0, 1, 0),
(27, 5, 23, 'Attendance update has been posted.', 1, '2025-08-17 17:49:19', 0, 1, 0),
(28, 1, 23, 'Thank you for reaching out.', 1, '2025-08-17 17:53:25', 0, 1, 0),
(29, 5, 23, 'Attendance update has been posted.', 1, '2025-08-17 17:53:33', 0, 1, 0),
(30, 1, 22, 'Thanks for your hard work!', 0, '2025-08-17 17:53:47', 0, 1, 1),
(31, 5, 23, 'Attendance update has been posted. We noticed great improvement this week!', 1, '2025-08-17 17:54:02', 0, 1, 0),
(32, 5, 23, 'Here\'s your child\'s progress update.', 1, '2025-08-17 17:59:34', 0, 1, 0),
(33, 1, 15, 'edited new', 0, '2025-08-17 18:01:28', 1, 0, 0),
(34, 1, 25, 'Please sign the consent form sent today.', 1, '2025-08-19 18:31:07', 0, 0, 0),
(35, 1, 5, 'Please upload lesson plans by Friday.', 1, '2025-08-22 15:14:37', 0, 0, 0),
(36, 2, 5, 'Submit lesson plans by Friday.', 1, '2025-08-31 13:10:10', 0, 0, 0),
(37, 2, 1, 'Review system reports today.', 1, '2025-08-31 13:10:14', 0, 0, 0),
(38, 2, 3, 'I\'ll review your reports.', 1, '2025-08-31 13:10:20', 0, 0, 0),
(39, 27, 1, 'How can teachers help?', 1, '2025-08-31 17:51:41', 0, 0, 0),
(40, 10, 23, 'Your child is doing well.', 1, '2025-08-31 18:40:52', 0, 0, 0),
(41, 10, 1, 'Explain new policies?', 1, '2025-08-31 18:43:58', 0, 0, 0),
(42, 23, 5, 'How is my child doing?', 1, '2025-08-31 19:00:07', 0, 0, 0),
(43, 19, 1, 'Concerned about curriculum.', 1, '2025-09-18 13:21:04', 0, 0, 0),
(44, 19, 30, 'Here\'s this month\'s actvities.', 0, '2025-09-18 13:21:17', 0, 0, 0),
(45, 5, 3, 'When is the next meeting?', 0, '2025-09-18 13:31:52', 0, 0, 0),
(46, 23, 1, 'k', 1, '2025-09-18 13:57:22', 0, 0, 0),
(47, 23, 1, 'namecheap!!!!', 1, '2025-10-11 14:02:43', 0, 0, 0),
(48, 23, 1, 'I\'m concerned about direction.', 1, '2025-10-11 14:22:16', 0, 0, 0),
(49, 1, 23, 'namecheap testing mate hehe', 1, '2025-10-11 16:32:17', 1, 0, 0),
(50, 1, 5, 'halo', 0, '2025-10-11 18:55:32', 0, 0, 0),
(51, 1, 5, 'Please upload lesson plans by Friday. hah', 0, '2025-10-11 18:55:37', 1, 0, 0),
(52, 1, 2, 'asap, Let\'s review reports tomorrow.', 1, '2025-10-11 19:19:39', 1, 0, 0),
(53, 1, 2, 'l', 1, '2025-10-11 19:19:42', 0, 1, 0),
(54, 23, 5, 'What should they focus on?', 1, '2025-10-15 08:32:35', 0, 0, 0),
(55, 23, 10, 'ok got it', 0, '2025-10-15 08:32:40', 1, 0, 0),
(56, 23, 1, 'gege', 1, '2025-10-15 08:32:56', 0, 0, 0),
(57, 23, 1, 'l', 1, '2025-10-15 08:32:59', 0, 1, 0),
(58, 23, 3, 'What\'s the enrollment process?', 1, '2025-10-15 08:33:19', 0, 0, 0),
(59, 1, 23, 'Thank you for reaching out.', 1, '2025-10-15 08:35:04', 0, 0, 0),
(60, 27, 1, 'Any development programs?', 1, '2025-10-15 11:23:42', 0, 0, 0),
(61, 27, 2, 'When is the next meeting?', 1, '2025-10-15 11:24:01', 0, 0, 0),
(62, 27, 5, 'k', 0, '2025-10-15 11:24:18', 0, 1, 0),
(63, 27, 5, 'Want to share lesson plans? ha', 0, '2025-10-15 11:24:19', 1, 0, 0),
(64, 27, 3, 'Need more class materials.', 1, '2025-10-15 11:33:50', 0, 0, 0),
(65, 3, 27, 'ok', 0, '2025-10-15 11:34:14', 0, 0, 0),
(66, 3, 23, 'I\'ll check this matter...', 1, '2025-10-15 11:34:29', 1, 0, 0),
(67, 3, 1, 'Review system reports today.', 1, '2025-10-15 11:34:50', 0, 1, 0),
(68, 1, 3, 'Please coordinate with teachers for the event.', 0, '2025-10-15 11:35:33', 0, 0, 0),
(69, 2, 3, 'test', 1, '2025-10-19 12:34:13', 0, 0, 0),
(70, 1, 2, 'hmmmm', 1, '2025-10-19 13:08:09', 0, 0, 0),
(71, 1, 2, 'leaderrr', 1, '2025-10-19 13:15:04', 0, 0, 0),
(72, 3, 2, 'ok test', 1, '2025-10-19 14:32:37', 0, 0, 0),
(73, 25, 2, 'When is the next meeting?', 1, '2025-10-21 18:12:40', 0, 0, 0),
(74, 25, 5, 'Got it', 0, '2025-10-21 18:13:05', 0, 0, 0),
(75, 2, 1, 'leaderrr', 1, '2025-10-22 12:09:46', 0, 0, 0),
(76, 1, 2, 'chat ko', 1, '2025-10-23 04:16:13', 0, 0, 0),
(77, 2, 1, 'okay', 1, '2025-10-23 04:17:30', 0, 0, 0),
(78, 2, 1, 'Review system reports today.', 1, '2025-10-23 04:17:54', 0, 0, 0),
(79, 2, 1, 'Review system reports today.', 1, '2025-10-23 04:18:13', 0, 0, 0),
(80, 2, 1, 'Check latest updates.', 1, '2025-10-23 04:18:44', 0, 0, 0),
(81, 2, 1, 'chat ko', 1, '2025-10-23 04:19:03', 0, 1, 0),
(82, 2, 3, 'Let\'s meet this week.', 0, '2025-10-23 13:14:21', 0, 0, 0),
(83, 23, 1, 'I\'m concerned about direction.', 1, '2025-10-23 14:08:52', 0, 0, 0),
(84, 1, 23, 'ok', 1, '2025-10-23 14:09:20', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_comm_group`
--

CREATE TABLE `tbl_comm_group` (
  `group_id` int(11) NOT NULL,
  `group_type` enum('Class','Staff','Overall') NOT NULL,
  `group_name` varchar(150) NOT NULL,
  `group_ref_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_comm_group`
--

INSERT INTO `tbl_comm_group` (`group_id`, `group_type`, `group_name`, `group_ref_id`) VALUES
(1, 'Overall', 'GENERAL', NULL),
(2, 'Staff', 'ALL STAFF', NULL),
(3, 'Class', 'Class Advisory - Discoverer', 1),
(4, 'Class', 'Class Advisory - Explorer', 2),
(5, 'Class', 'Class Advisory - Adventurer', 3);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_comm_group_message`
--

CREATE TABLE `tbl_comm_group_message` (
  `group_message_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_edited` tinyint(1) NOT NULL DEFAULT 0,
  `is_unsent` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_comm_group_message`
--

INSERT INTO `tbl_comm_group_message` (`group_message_id`, `group_id`, `sender_id`, `message_text`, `sent_at`, `is_edited`, `is_unsent`) VALUES
(1, 1, 1, 'halo general', '2025-08-17 14:41:31', 0, 0),
(2, 2, 1, 'meeting daw', '2025-08-17 14:43:45', 0, 0),
(3, 3, 1, 'discoverer', '2025-08-17 14:44:03', 0, 0),
(4, 4, 1, 'explorer', '2025-08-17 14:44:07', 0, 0),
(5, 5, 1, 'adventurer', '2025-08-17 14:44:12', 0, 0),
(6, 1, 1, 'edited halo new meetring \n\nDAW \n\nambot unsa to bay\n\nkabalo na diay ko', '2025-08-17 14:51:53', 1, 0),
(7, 2, 1, 'unsent mehhi', '2025-08-17 14:52:36', 0, 1),
(8, 2, 1, 'new messiji', '2025-08-17 14:58:34', 0, 1),
(9, 4, 5, 'Great effort today, everyone!', '2025-08-17 16:51:09', 0, 0),
(10, 2, 5, 'Thank you!', '2025-08-17 18:13:55', 0, 0),
(11, 1, 1, 'Reminder: School fair this Friday!', '2025-08-20 13:13:10', 0, 0),
(12, 3, 1, 'Parent–teacher conference schedule is posted.', '2025-08-20 13:13:24', 0, 0),
(13, 4, 1, 'Parent–teacher conference schedule is posted.', '2025-08-20 13:13:27', 0, 0),
(14, 5, 1, 'Parent–teacher conference schedule is posted.', '2025-08-20 13:13:30', 0, 0),
(15, 1, 1, 'Emergency drill tomorrow at 10 AM.', '2025-08-22 13:21:15', 0, 0),
(16, 1, 2, 'Share meeting details.', '2025-08-31 13:10:36', 0, 0),
(17, 4, 1, 'k', '2025-08-31 17:43:44', 0, 0),
(18, 2, 2, 'Thank you, team!', '2025-08-31 17:48:07', 0, 0),
(19, 3, 27, 'Any schedule updates?', '2025-08-31 17:49:59', 0, 0),
(20, 1, 2, 'Reminder: School fair this Friday!', '2025-08-31 17:56:33', 0, 0),
(21, 4, 10, 'When are field trips?', '2025-08-31 18:40:27', 0, 0),
(22, 4, 25, 'When are the upcoming field trip?', '2025-08-31 18:44:43', 1, 0),
(23, 1, 28, 'ok', '2025-09-04 12:51:01', 0, 0),
(24, 2, 1, 'Do you need any materials or support?', '2025-10-11 19:23:40', 0, 0),
(25, 3, 1, 'Meeting reminder for tomorrow. hah', '2025-10-11 19:28:01', 1, 1),
(26, 3, 1, 'hh', '2025-10-11 19:28:12', 0, 1),
(27, 1, 23, 'got it', '2025-10-15 08:33:49', 0, 0),
(28, 5, 23, 'What activities is due this week? hehe', '2025-10-15 08:34:06', 1, 0),
(29, 5, 23, 'k', '2025-10-15 08:34:17', 0, 1),
(30, 2, 1, 'Faculty meeting at 3 PM today.', '2025-10-15 08:35:58', 0, 0),
(31, 3, 1, 'Please bring art materials tomorrow.', '2025-10-15 08:36:25', 0, 0),
(32, 2, 27, 'ok', '2025-10-15 11:30:29', 0, 1),
(33, 3, 27, 'Any schedule updates??', '2025-10-15 11:30:37', 1, 0),
(34, 2, 27, 'Need help with lesson plans?', '2025-10-15 11:30:56', 0, 0),
(35, 1, 3, 'Please check the weekly newsletter. hahaha', '2025-10-15 11:35:54', 1, 0),
(36, 2, 3, 'Faculty meeting at 3 PM today.', '2025-10-15 11:36:04', 0, 0),
(37, 4, 23, 'hmm', '2025-10-19 12:48:21', 0, 0),
(38, 2, 1, 'open open ML', '2025-10-19 12:53:28', 0, 1),
(39, 1, 1, 'Emergency drill tomorrow at 10 AM.', '2025-10-19 14:33:25', 0, 0),
(40, 1, 1, 'j', '2025-10-19 14:35:02', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_comm_group_read`
--

CREATE TABLE `tbl_comm_group_read` (
  `group_message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_comm_group_read`
--

INSERT INTO `tbl_comm_group_read` (`group_message_id`, `user_id`, `read_at`) VALUES
(1, 1, '2025-08-17 22:44:14'),
(1, 2, '2025-08-31 19:36:57'),
(1, 3, '2025-10-15 07:35:46'),
(1, 5, '2025-08-18 00:55:37'),
(1, 10, '2025-09-01 02:40:17'),
(1, 19, '2025-10-19 08:51:20'),
(1, 23, '2025-09-01 01:57:05'),
(1, 25, '2025-09-01 02:44:34'),
(1, 27, '2025-09-01 01:49:55'),
(1, 28, '2025-08-20 20:48:51'),
(2, 1, '2025-08-17 22:44:21'),
(2, 2, '2025-09-01 01:48:03'),
(2, 3, '2025-10-15 07:35:56'),
(2, 5, '2025-08-18 00:54:49'),
(2, 10, '2025-09-01 02:40:19'),
(2, 19, '2025-10-19 08:51:19'),
(2, 27, '2025-09-01 01:55:10'),
(3, 1, '2025-08-17 22:44:20'),
(3, 2, '2025-09-01 02:20:57'),
(3, 27, '2025-09-01 01:49:39'),
(4, 1, '2025-08-17 22:44:19'),
(4, 2, '2025-09-01 02:20:59'),
(4, 5, '2025-08-18 00:50:44'),
(4, 10, '2025-09-01 02:40:22'),
(4, 23, '2025-10-19 08:48:11'),
(4, 25, '2025-09-01 02:44:29'),
(4, 28, '2025-08-20 20:48:55'),
(5, 1, '2025-08-17 22:44:17'),
(5, 2, '2025-09-01 02:21:05'),
(5, 19, '2025-10-19 08:51:34'),
(5, 23, '2025-10-15 04:34:01'),
(6, 1, '2025-08-17 22:59:52'),
(6, 2, '2025-08-31 19:36:57'),
(6, 3, '2025-10-15 07:35:46'),
(6, 5, '2025-08-18 00:55:37'),
(6, 10, '2025-09-01 02:40:17'),
(6, 19, '2025-10-19 08:51:20'),
(6, 23, '2025-09-01 01:57:05'),
(6, 25, '2025-09-01 02:44:34'),
(6, 27, '2025-09-01 01:49:55'),
(6, 28, '2025-08-20 20:48:51'),
(7, 1, '2025-08-18 00:18:14'),
(7, 2, '2025-09-01 01:48:03'),
(7, 3, '2025-10-15 07:35:56'),
(7, 5, '2025-08-18 00:54:49'),
(7, 10, '2025-09-01 02:40:19'),
(7, 19, '2025-10-19 08:51:19'),
(7, 27, '2025-09-01 01:55:10'),
(8, 1, '2025-08-18 00:18:14'),
(8, 2, '2025-09-01 01:48:03'),
(8, 3, '2025-10-15 07:35:56'),
(8, 5, '2025-08-18 00:54:49'),
(8, 10, '2025-09-01 02:40:19'),
(8, 19, '2025-10-19 08:51:19'),
(8, 27, '2025-09-01 01:55:10'),
(9, 1, '2025-08-18 00:51:26'),
(9, 2, '2025-09-01 02:20:59'),
(9, 5, '2025-08-18 00:58:31'),
(9, 10, '2025-09-01 02:40:22'),
(9, 23, '2025-10-19 08:48:11'),
(9, 25, '2025-09-01 02:44:29'),
(9, 28, '2025-08-20 20:48:55'),
(10, 1, '2025-08-18 02:14:00'),
(10, 2, '2025-09-01 01:48:03'),
(10, 3, '2025-10-15 07:35:56'),
(10, 5, '2025-08-18 02:16:57'),
(10, 10, '2025-09-01 02:40:19'),
(10, 19, '2025-10-19 08:51:19'),
(10, 27, '2025-09-01 01:55:10'),
(11, 1, '2025-08-22 21:21:03'),
(11, 2, '2025-08-31 19:36:57'),
(11, 3, '2025-10-15 07:35:46'),
(11, 10, '2025-09-01 02:40:17'),
(11, 19, '2025-10-19 08:51:20'),
(11, 23, '2025-09-01 01:57:05'),
(11, 25, '2025-09-01 02:44:34'),
(11, 27, '2025-09-01 01:49:55'),
(11, 28, '2025-09-04 20:50:57'),
(12, 1, '2025-08-20 21:13:40'),
(12, 2, '2025-09-01 02:20:57'),
(12, 27, '2025-09-01 01:49:39'),
(13, 1, '2025-09-01 01:34:17'),
(13, 2, '2025-09-01 02:20:59'),
(13, 10, '2025-09-01 02:40:22'),
(13, 23, '2025-10-19 08:48:11'),
(13, 25, '2025-09-01 02:44:29'),
(14, 1, '2025-09-01 01:34:20'),
(14, 2, '2025-09-01 02:21:05'),
(14, 19, '2025-10-19 08:51:34'),
(14, 23, '2025-10-15 04:34:01'),
(15, 1, '2025-08-31 21:14:00'),
(15, 2, '2025-08-31 19:36:57'),
(15, 3, '2025-10-15 07:35:46'),
(15, 10, '2025-09-01 02:40:17'),
(15, 19, '2025-10-19 08:51:20'),
(15, 23, '2025-09-01 01:57:05'),
(15, 25, '2025-09-01 02:44:34'),
(15, 27, '2025-09-01 01:49:55'),
(15, 28, '2025-09-04 20:50:57'),
(16, 1, '2025-08-31 21:14:00'),
(16, 2, '2025-09-01 01:47:58'),
(16, 3, '2025-10-15 07:35:46'),
(16, 10, '2025-09-01 02:40:17'),
(16, 19, '2025-10-19 08:51:20'),
(16, 23, '2025-09-01 01:57:06'),
(16, 25, '2025-09-01 02:44:34'),
(16, 27, '2025-09-01 01:49:55'),
(16, 28, '2025-09-04 20:50:57'),
(17, 1, '2025-09-01 01:57:52'),
(17, 2, '2025-09-01 02:20:59'),
(17, 10, '2025-09-01 02:40:22'),
(17, 23, '2025-10-19 08:48:11'),
(17, 25, '2025-09-01 02:44:29'),
(18, 1, '2025-09-01 01:58:04'),
(18, 2, '2025-09-01 01:48:26'),
(18, 3, '2025-10-15 07:35:56'),
(18, 10, '2025-09-01 02:40:19'),
(18, 19, '2025-10-19 08:51:19'),
(18, 27, '2025-09-01 01:55:10'),
(19, 1, '2025-09-01 01:58:12'),
(19, 2, '2025-09-01 02:20:57'),
(19, 27, '2025-09-01 01:50:06'),
(20, 1, '2025-09-01 01:57:54'),
(20, 2, '2025-09-01 02:20:51'),
(20, 3, '2025-10-15 07:35:46'),
(20, 10, '2025-09-01 02:40:17'),
(20, 19, '2025-10-19 08:51:20'),
(20, 23, '2025-09-01 01:57:06'),
(20, 25, '2025-09-01 02:44:34'),
(20, 28, '2025-09-04 20:50:57'),
(21, 1, '2025-10-23 00:18:35'),
(21, 2, '2025-09-01 02:59:30'),
(21, 23, '2025-10-19 08:48:11'),
(21, 25, '2025-09-01 02:44:29'),
(22, 1, '2025-10-23 00:18:35'),
(22, 2, '2025-09-01 02:59:30'),
(22, 23, '2025-10-19 08:48:11'),
(22, 25, '2025-09-01 02:44:55'),
(23, 1, '2025-10-11 15:28:35'),
(23, 2, '2025-10-19 08:34:40'),
(23, 3, '2025-10-15 07:35:46'),
(23, 19, '2025-10-19 08:51:20'),
(23, 23, '2025-09-18 21:43:51'),
(23, 25, '2025-10-15 07:44:32'),
(24, 1, '2025-10-11 15:27:50'),
(24, 2, '2025-10-23 00:21:01'),
(24, 3, '2025-10-15 07:35:56'),
(24, 19, '2025-10-19 08:51:19'),
(24, 27, '2025-10-15 07:30:18'),
(25, 1, '2025-10-11 15:28:33'),
(25, 2, '2025-10-23 00:21:02'),
(25, 27, '2025-10-15 07:30:33'),
(26, 1, '2025-10-11 15:28:33'),
(26, 2, '2025-10-23 00:21:02'),
(26, 27, '2025-10-15 07:30:33'),
(27, 1, '2025-10-19 08:53:15'),
(27, 2, '2025-10-19 08:34:40'),
(27, 3, '2025-10-15 07:35:46'),
(27, 19, '2025-10-19 08:51:20'),
(27, 23, '2025-10-19 08:49:29'),
(27, 25, '2025-10-15 07:44:32'),
(28, 1, '2025-10-23 00:18:35'),
(28, 2, '2025-10-19 08:36:04'),
(28, 19, '2025-10-19 08:51:34'),
(29, 1, '2025-10-23 00:18:35'),
(29, 2, '2025-10-19 08:36:04'),
(29, 19, '2025-10-19 08:51:34'),
(30, 1, '2025-10-19 08:53:18'),
(30, 2, '2025-10-23 00:21:01'),
(30, 3, '2025-10-15 07:35:56'),
(30, 19, '2025-10-19 08:51:19'),
(30, 27, '2025-10-15 07:30:18'),
(31, 1, '2025-10-23 00:18:34'),
(31, 2, '2025-10-23 00:21:02'),
(31, 27, '2025-10-15 07:30:33'),
(32, 1, '2025-10-19 08:53:18'),
(32, 2, '2025-10-23 00:21:01'),
(32, 3, '2025-10-15 07:35:56'),
(32, 19, '2025-10-19 08:51:19'),
(32, 27, '2025-10-15 07:30:39'),
(33, 1, '2025-10-23 00:18:34'),
(33, 2, '2025-10-23 00:21:02'),
(33, 27, '2025-10-15 07:30:41'),
(34, 1, '2025-10-19 08:53:18'),
(34, 2, '2025-10-23 00:21:01'),
(34, 3, '2025-10-15 07:35:56'),
(34, 19, '2025-10-19 08:51:19'),
(35, 1, '2025-10-19 08:53:15'),
(35, 2, '2025-10-19 08:34:40'),
(35, 3, '2025-10-19 10:32:52'),
(35, 19, '2025-10-19 08:51:20'),
(35, 23, '2025-10-19 08:49:29'),
(35, 25, '2025-10-15 07:44:32'),
(36, 1, '2025-10-19 08:53:18'),
(36, 2, '2025-10-23 00:21:01'),
(36, 3, '2025-10-19 10:35:10'),
(36, 19, '2025-10-19 08:51:19'),
(37, 1, '2025-10-23 00:18:35'),
(37, 2, '2025-10-23 00:21:03'),
(37, 23, '2025-10-19 08:49:48'),
(38, 1, '2025-10-19 10:31:14'),
(38, 2, '2025-10-23 00:21:01'),
(38, 3, '2025-10-19 10:35:10'),
(39, 1, '2025-10-19 10:33:35'),
(39, 2, '2025-10-23 00:13:25'),
(39, 3, '2025-10-19 10:34:02'),
(40, 2, '2025-10-23 00:13:25'),
(40, 3, '2025-10-19 10:35:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_meetings`
--

CREATE TABLE `tbl_meetings` (
  `meeting_id` int(11) NOT NULL,
  `meeting_title` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `advisory_id` int(11) DEFAULT NULL,
  `meeting_start` datetime NOT NULL,
  `meeting_end` datetime NOT NULL,
  `meeting_agenda` text NOT NULL,
  `meeting_status` enum('Scheduled','Completed','Cancelled','Rescheduled') DEFAULT 'Scheduled',
  `parent_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `parent_read_at` datetime DEFAULT NULL,
  `lead_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `lead_read_at` datetime DEFAULT NULL,
  `assistant_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `assistant_read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_meetings`
--

INSERT INTO `tbl_meetings` (`meeting_id`, `meeting_title`, `parent_id`, `student_id`, `advisory_id`, `meeting_start`, `meeting_end`, `meeting_agenda`, `meeting_status`, `parent_is_read`, `parent_read_at`, `lead_is_read`, `lead_read_at`, `assistant_is_read`, `assistant_read_at`) VALUES
(1, 'General PTA Meeting', NULL, NULL, NULL, '2025-07-14 09:00:00', '2025-07-14 10:00:00', 'Review recent school programs and collect parent feedback.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(2, 'School Assembly Briefing', NULL, NULL, NULL, '2025-07-14 14:00:00', '2025-07-14 15:00:00', 'Present upcoming school activities and reminders for all staff.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(3, 'Curriculum Enhancement Workshop', NULL, NULL, NULL, '2025-07-17 09:00:00', '2025-07-17 10:00:00', 'Evaluate and improve the learning materials used this semester.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(4, 'Community Partnership Dialogue', NULL, NULL, NULL, '2025-07-18 09:00:00', '2025-07-18 10:00:00', 'Build collaboration between the school, parents, and local community.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(5, 'Learning Assessment Review', NULL, NULL, NULL, '2025-07-26 10:00:00', '2025-07-26 10:30:00', 'Evaluate student performance results from recent assessments.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(6, 'Quarterly Performance Review', NULL, NULL, NULL, '2025-08-01 09:00:00', '2025-08-01 10:00:00', 'Evaluate quarterly results and set improvement targets for the next term.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(8, 'Curriculum Planning Assembly', NULL, NULL, NULL, '2025-07-18 11:00:00', '2025-07-18 12:00:00', 'Finalize revisions to lesson plans and subject coverage.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(9, 'School Maintenance Briefing', NULL, NULL, NULL, '2025-07-26 09:00:00', '2025-07-26 10:00:00', 'Address upcoming school maintenance schedules and safety reminders.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(10, 'Academic Strategy Consultation', NULL, NULL, NULL, '2025-07-23 09:00:00', '2025-07-23 10:00:00', 'Formulate strategies to improve student performance across subjects.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(11, 'Individual Academic Review', 23, 7, 2, '2025-07-29 09:00:00', '2025-07-29 10:00:00', 'Go over the student’s test results and improvement plan.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(12, 'One-on-One Parent Consultation', 7, 3, 2, '2025-07-25 09:00:00', '2025-07-25 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(13, 'Private Parent Meeting', 23, 7, 2, '2025-07-25 10:00:00', '2025-07-25 11:00:00', 'Address learning challenges and suggest support strategies at home.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(15, 'One-on-One Parent Consultation', 23, 7, 2, '2025-07-27 09:00:00', '2025-07-27 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(16, 'Student Progress Discussion', 7, 3, 2, '2025-07-23 11:00:00', '2025-07-23 12:00:00', 'Review academic achievements and identify areas needing attention.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(17, 'Class Adviser Coordination', NULL, NULL, NULL, '2025-07-15 09:00:00', '2025-07-15 10:00:00', 'Discuss progress reports and class-specific student issues.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(18, 'Student Progress Discussion', 25, 6, 2, '2025-08-20 09:00:00', '2025-08-20 10:00:00', 'Review academic achievements and identify areas needing attention.', 'Completed', 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(19, 'Academic Committee Planning', NULL, NULL, NULL, '2025-08-05 09:00:00', '2025-08-05 10:00:00', 'Organize academic-related projects and finalize schedules.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(20, 'School Maintenance Briefing', NULL, NULL, NULL, '2025-08-08 09:00:00', '2025-08-08 10:00:00', 'Address upcoming school maintenance schedules and safety reminders.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(21, 'Student Development Workshop', NULL, NULL, NULL, '2025-08-09 09:00:00', '2025-08-09 10:00:00', 'Plan enrichment activities to enhance student learning experiences.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(22, 'Teacher Mentorship Session', NULL, NULL, NULL, '2025-08-09 09:00:00', '2025-08-09 10:00:00', 'Pair new teachers with mentors and discuss guidance strategies.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(23, 'Class Adviser Coordination', NULL, NULL, NULL, '2025-08-11 09:00:00', '2025-08-11 10:00:00', 'Discuss progress reports and class-specific student issues.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(24, 'Student Progress Discussion', 23, 7, 2, '2025-08-15 09:00:00', '2025-08-15 10:00:00', 'Review academic achievements and identify areas needing attention.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(25, 'Homeroom Advisers’ Consultation', NULL, NULL, NULL, '2025-08-16 09:00:00', '2025-08-16 10:00:00', 'Address class concerns and reinforce student engagement strategies.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(26, 'Class Adviser Coordination', NULL, NULL, 2, '2025-08-21 09:00:00', '2025-08-21 10:00:00', 'Discuss progress reports and class-specific student issues.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(27, 'One-on-One Parent Consultation', 23, 7, 2, '2025-08-22 09:00:00', '2025-08-22 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(28, 'Student Discipline Committee Meeting', NULL, NULL, NULL, '2025-08-23 09:00:00', '2025-08-23 10:00:00', 'Address recent behavioral cases and implement action plans.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(29, 'Community Partnership Dialogue', NULL, NULL, NULL, '2025-08-20 10:00:00', '2025-08-20 11:00:00', 'Build collaboration between the school, parents, and local community.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(31, 'Private Parent Meeting', 20, 8, 2, '2025-08-30 10:00:00', '2025-08-30 11:00:00', 'Address learning challenges and suggest support strategies at home.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(32, 'One-on-One Parent Consultation', 23, 5, 3, '2025-08-15 09:00:00', '2025-08-15 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Completed', 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(33, 'Administrative Policy Review', NULL, NULL, NULL, '2025-09-02 09:00:00', '2025-09-02 10:00:00', 'Revisit and update existing school policies and implementation guidelines.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(34, 'Academic Progress Consultation', NULL, NULL, NULL, '2025-09-03 09:00:00', '2025-09-03 10:00:00', 'Review and analyze students’ overall academic performance.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(35, 'Community Partnership Dialogue', NULL, NULL, NULL, '2025-09-04 09:00:00', '2025-09-04 10:00:00', 'Build collaboration between the school, parents, and local community.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(36, 'Student Discipline Committee Meeting', NULL, NULL, NULL, '2025-09-12 09:00:00', '2025-09-12 10:00:00', 'Address recent behavioral cases and implement action plans.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(37, 'School Event Planning Session', NULL, NULL, NULL, '2025-09-19 09:00:00', '2025-09-19 10:00:00', 'Plan logistics for the upcoming school-wide celebration.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(38, 'One-on-One Parent Consultation', 7, 3, 2, '2025-08-18 14:00:00', '2025-08-18 15:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(39, 'Individual Academic Review', 23, 7, 2, '2025-09-03 09:00:00', '2025-09-03 10:00:00', 'Go over the student’s test results and improvement plan.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(40, 'Student Progress Discussion', 28, 11, 2, '2025-08-30 09:00:00', '2025-08-30 10:00:00', 'Review academic achievements and identify areas needing attention.', 'Completed', 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(41, 'Behavioral Consultation', 23, 7, 2, '2025-08-31 09:00:00', '2025-08-31 10:00:00', 'Talk about classroom conduct and ways to improve student discipline.', 'Completed', 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(42, 'Class Adviser Coordination', NULL, NULL, NULL, '2025-09-13 09:00:00', '2025-09-13 10:00:00', 'Discuss progress reports and class-specific student issues.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(43, 'School Event Planning Session', NULL, NULL, NULL, '2025-09-07 09:00:00', '2025-09-07 10:00:00', 'Plan logistics for the upcoming school-wide celebration.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(44, 'Disaster Preparedness OrientationDisaster Preparedness Orientation', NULL, NULL, NULL, '2025-09-14 09:00:00', '2025-09-14 10:00:00', 'Educate staff and students on emergency evacuation procedures.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(45, 'Attendance Monitoring Discussion', NULL, NULL, NULL, '2025-09-15 09:00:00', '2025-09-15 10:00:00', 'Address attendance trends and interventions for frequently absent students.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(46, 'Parent Support Orientation', NULL, NULL, NULL, '2025-10-01 09:00:00', '2025-10-01 10:00:00', 'Orient parents on new policies and school participation programs.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(47, 'Class Adviser Coordination', NULL, NULL, NULL, '2025-10-16 09:00:00', '2025-10-16 10:00:00', 'Discuss progress reports and class-specific student issues.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(48, 'Administrative Progress Evaluation', NULL, NULL, NULL, '2025-10-09 09:00:00', '2025-10-09 10:00:00', 'Review implementation of ongoing school improvement projects.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(49, 'Disaster Preparedness Orientation', NULL, NULL, NULL, '2025-10-09 13:00:00', '2025-10-09 14:00:00', 'Educate staff and students on emergency evacuation procedures.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(50, 'Attendance Monitoring Discussion', NULL, NULL, NULL, '2025-10-15 09:00:00', '2025-10-15 10:00:00', 'Address attendance trends and interventions for frequently absent students.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(51, 'Academic Strategy Consultation', NULL, NULL, NULL, '2025-10-10 09:00:00', '2025-10-10 10:00:00', 'Formulate strategies to improve student performance across subjects.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(52, 'Class Officers’ Assembly', NULL, NULL, NULL, '2025-10-23 09:00:00', '2025-10-23 10:00:00', 'Brief student leaders on responsibilities and upcoming events.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(53, 'Student Development Workshop', NULL, NULL, NULL, '2025-10-25 09:00:00', '2025-10-25 10:00:00', 'Plan enrichment activities to enhance student learning experiences.', 'Cancelled', 0, NULL, 0, NULL, 0, NULL),
(54, 'Student Development Workshop', NULL, NULL, NULL, '2025-10-19 09:00:00', '2025-10-19 10:00:00', 'Plan enrichment activities to enhance student learning experiences.', 'Completed', 0, NULL, 0, NULL, 0, NULL),
(55, 'Academic Progress Consultation', NULL, NULL, NULL, '2025-10-28 09:00:00', '2025-10-28 10:00:00', 'Review and analyze students’ overall academic performance.', 'Rescheduled', 0, NULL, 0, NULL, 0, NULL),
(56, 'Administrative Progress Evaluation', NULL, NULL, NULL, '2025-10-30 09:00:00', '2025-10-30 10:00:00', 'Review implementation of ongoing school improvement projects.', 'Scheduled', 0, NULL, 0, NULL, 0, NULL),
(57, 'General PTA Meeting', NULL, NULL, NULL, '2025-10-30 10:00:00', '2025-10-30 11:00:00', 'Review recent school programs and collect parent feedback.', 'Rescheduled', 0, NULL, 0, NULL, 0, NULL),
(58, 'Administrative Policy Review', NULL, NULL, NULL, '2025-10-25 09:00:00', '2025-10-25 10:00:00', 'Revisit and update existing school policies and implementation guidelines.', 'Cancelled', 0, NULL, 0, NULL, 0, NULL),
(59, 'Faculty-Parent Partnership Talk', NULL, NULL, NULL, '2025-10-25 13:00:00', '2025-10-25 14:00:00', 'Build collaboration between teachers and parents for student success.', 'Rescheduled', 0, NULL, 0, NULL, 0, NULL),
(60, 'One-on-One Parent Consultation', 30, 15, 1, '2025-10-24 09:00:00', '2025-10-24 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Scheduled', 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(61, 'Student Progress Discussion', 30, 15, 1, '2025-10-25 09:00:00', '2025-10-25 10:00:00', 'Review academic achievements and identify areas needing attention.', 'Cancelled', 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(62, 'Behavioral Consultation', 18, 21, 1, '2025-10-21 09:00:00', '2025-10-21 10:00:00', 'Talk about classroom conduct and ways to improve student discipline.', 'Completed', 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(63, 'Individual Academic Review', 18, 21, 1, '2025-10-26 09:00:00', '2025-10-26 10:00:00', 'Go over the student’s test results and improvement plan.', 'Rescheduled', 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(64, 'One-on-One Parent Consultation', 6, 1, 1, '2025-10-25 09:00:00', '2025-10-25 10:00:00', 'Discuss the student’s recent performance and classroom behavior.', 'Cancelled', 0, NULL, 1, '2025-10-15 05:28:14', 0, NULL),
(65, 'Student Progress Discussion', 23, 7, 2, '2025-10-31 09:00:00', '2025-10-31 10:00:00', 'Review academic achievements and identify areas needing attention. ', 'Scheduled', 0, NULL, 0, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notifications`
--

CREATE TABLE `tbl_notifications` (
  `notification_id` int(11) NOT NULL,
  `meeting_id` int(11) DEFAULT NULL,
  `notif_message` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_notifications`
--

INSERT INTO `tbl_notifications` (`notification_id`, `meeting_id`, `notif_message`, `created_by`, `created_at`) VALUES
(1, 1, '[MEETING] Created the Meeting', 1, '2025-07-14 13:41:18'),
(2, 2, '[MEETING] Created the Meeting', 1, '2025-07-14 13:42:18'),
(3, 3, '[MEETING] Created the Meeting', 1, '2025-07-14 13:42:44'),
(4, 4, '[MEETING] Created the Meeting', 1, '2025-07-14 13:43:23'),
(5, 5, '[MEETING] Created the Meeting', 1, '2025-07-14 13:43:54'),
(6, 6, '[MEETING] Created the Meeting', 1, '2025-07-14 13:44:34'),
(8, 8, '[MEETING] Created the Meeting', 1, '2025-07-14 13:45:28'),
(9, 9, '[MEETING] Created the Meeting', 1, '2025-07-14 13:46:13'),
(10, 10, '[MEETING] Created the Meeting', 1, '2025-07-14 13:46:30'),
(11, 9, '[MEETING] Created the Meeting', 1, '2025-07-14 13:46:34'),
(12, 10, '[MEETING] Created the Meeting', 1, '2025-07-14 13:46:43'),
(13, 11, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-14 13:47:28'),
(14, 12, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-14 13:47:47'),
(15, 13, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-14 13:48:06'),
(16, 13, '[MEETING] Cancelled the meeting', 5, '2025-07-14 13:48:13'),
(17, 11, '[ONE ON ONE MEETING] Rescheduled the meeting', 1, '2025-07-14 15:40:51'),
(19, 5, '[MEETING] Rescheduled the meeting', 1, '2025-07-14 17:42:56'),
(20, 12, '[ONE ON ONE MEETING] Rescheduled the meeting', 1, '2025-07-14 17:43:30'),
(22, 15, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-14 17:47:27'),
(23, 16, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-14 17:48:05'),
(24, 15, '[MEETING] Cancelled the meeting', 5, '2025-07-14 17:48:11'),
(25, 17, '[MEETING] Created the Meeting', 1, '2025-07-15 07:48:07'),
(26, 18, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-07-15 07:54:59'),
(27, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:12:55'),
(28, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:09:25'),
(29, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-10-07 10:30:43'),
(30, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-10-07 10:30:47'),
(31, NULL, '[OVERALL PROGRESS] Updated an Overall progress', 5, '2025-08-06 08:56:30'),
(32, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:04'),
(33, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:05'),
(34, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:06'),
(35, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:07'),
(36, NULL, '[OVERALL PROGRESS] Updated an Overall progress', 5, '2025-07-30 07:20:08'),
(37, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:41'),
(38, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:42'),
(39, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:43'),
(40, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:20:44'),
(41, NULL, '[OVERALL PROGRESS] Updated an Overall progress', 5, '2025-07-30 07:20:44'),
(42, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:21:13'),
(43, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:21:20'),
(44, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 5, '2025-07-30 07:21:24'),
(45, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 10, '2025-07-30 09:43:10'),
(46, 19, '[MEETING] Created the Meeting', 1, '2025-08-04 07:20:17'),
(47, 19, '[MEETING] Cancelled the meeting', 1, '2025-08-04 07:20:56'),
(48, 20, '[MEETING] Created the Meeting', 1, '2025-08-04 08:44:17'),
(49, 21, '[MEETING] Created the Meeting', 1, '2025-08-04 08:44:53'),
(50, 21, '[MEETING] Cancelled the meeting', 1, '2025-08-04 08:45:04'),
(51, 22, '[MEETING] Created the Meeting', 1, '2025-08-04 09:09:24'),
(52, 23, '[MEETING] Created the Meeting', 1, '2025-08-04 09:09:57'),
(53, 23, '[MEETING] Rescheduled the meeting', 1, '2025-08-04 09:10:24'),
(54, 23, '[MEETING] Cancelled the meeting', 1, '2025-08-04 09:10:41'),
(55, 24, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-08-04 13:02:10'),
(56, 25, '[MEETING] Created the Meeting', 1, '2025-08-04 13:44:42'),
(57, 18, '[ONE ON ONE MEETING] Rescheduled the meeting\n', 5, '2025-08-04 15:04:43'),
(58, 18, '[ONE ON ONE MEETING] Rescheduled the meeting\n', 5, '2025-08-04 15:05:43'),
(59, 26, '[MEETING] Created the Meeting', 5, '2025-08-04 15:34:05'),
(60, 26, '[ONE ON ONE MEETING] Rescheduled the meeting', 5, '2025-08-04 15:34:49'),
(61, 24, '[ONE ON ONE MEETING] Rescheduled the meeting', 5, '2025-08-04 15:35:29'),
(62, 26, '[MEETING] Rescheduled the meeting', 5, '2025-08-04 15:41:33'),
(63, 27, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-08-04 15:42:01'),
(64, 27, '[ONE ON ONE MEETING] Rescheduled the meeting', 5, '2025-08-04 15:42:22'),
(65, 27, '[ONE ON ONE MEETING] Cancelled the meeting', 5, '2025-08-04 15:43:56'),
(66, 26, '[MEETING] Rescheduled the meeting', 1, '2025-08-04 15:49:07'),
(67, 28, '[MEETING] Created the Meeting', 1, '2025-08-04 16:08:23'),
(68, 29, '[MEETING] Created the Meeting', 1, '2025-08-04 17:05:43'),
(69, 29, '[MEETING] Updated and rescheduled the meeting', 1, '2025-08-04 17:10:26'),
(73, 26, '[MEETING] Updated the meeting', 1, '2025-08-04 17:22:16'),
(74, 31, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-08-04 17:26:42'),
(75, 31, '[ONE ON ONE MEETING] Updated the meeting', 5, '2025-08-04 17:27:06'),
(76, 31, '[ONE ON ONE MEETING] Rescheduled the meeting', 5, '2025-08-04 17:31:47'),
(77, 31, '[ONE ON ONE MEETING] Cancelled the meeting', 5, '2025-08-04 17:32:16'),
(78, 32, '[ONE ON ONE MEETING] Created the Meeting', 19, '2025-08-05 14:15:39'),
(79, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 16:11:18'),
(80, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 16:11:20'),
(81, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 16:11:22'),
(82, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 16:11:23'),
(83, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 19, '2025-08-05 16:13:06'),
(84, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 19, '2025-08-05 17:33:39'),
(85, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 19, '2025-08-05 17:33:40'),
(86, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:33:01'),
(87, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:33:04'),
(88, NULL, '[OVERALL PROGRESS] Updated an Overall progress', 19, '2025-08-05 17:33:43'),
(89, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:34:28'),
(90, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:34:28'),
(91, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:34:29'),
(92, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 19, '2025-08-05 17:34:30'),
(93, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 19, '2025-08-05 17:34:32'),
(94, 28, '[MEETING] Updated the meeting', 1, '2025-08-09 13:18:55'),
(95, 33, '[MEETING] Created the Meeting', 1, '2025-08-09 13:20:22'),
(96, 33, '[MEETING] Updated the meeting', 1, '2025-08-09 13:20:41'),
(97, 33, '[MEETING] Updated the meeting', 1, '2025-08-09 13:21:19'),
(98, 33, '[MEETING] Updated the meeting', 1, '2025-08-09 13:23:35'),
(99, 34, '[MEETING] Created the Meeting', 1, '2025-08-09 13:33:11'),
(100, 34, '[MEETING] Updated the meeting', 1, '2025-08-09 13:34:00'),
(101, 34, '[MEETING] Updated the meeting', 1, '2025-08-09 13:35:14'),
(102, 34, '[MEETING] Updated the meeting', 1, '2025-08-09 13:48:45'),
(103, 34, '[MEETING] Updated the meeting', 1, '2025-08-09 13:49:26'),
(104, 34, '[MEETING] Updated the meeting', 1, '2025-08-09 13:56:12'),
(105, 35, '[MEETING] Updated the meeting', 1, '2025-08-09 14:21:10'),
(106, 36, '[MEETING] Rescheduled the meeting', 1, '2025-08-09 14:23:14'),
(107, 37, '[MEETING] Cancelled the meeting', 1, '2025-08-09 14:29:04'),
(108, 38, '[ONE ON ONE MEETING] Rescheduled the meeting', 5, '2025-08-09 18:39:01'),
(109, 39, '[MEETING] Cancelled the meeting', 3, '2025-08-31 11:32:09'),
(110, 40, '[ONE ON ONE MEETING] Cancelled the meeting', 5, '2025-08-09 19:24:10'),
(111, 41, '[MEETING] Cancelled the meeting', 1, '2025-08-09 19:24:53'),
(112, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-30 18:59:14'),
(113, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-30 18:59:23'),
(114, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-30 18:59:29'),
(115, NULL, '[QUARTERLY PROGRESS] Updated a Quarterly Progress', 27, '2025-08-30 19:30:04'),
(116, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 27, '2025-08-30 19:33:10'),
(117, 42, '[MEETING] Created the Meeting', 2, '2025-08-31 09:43:53'),
(118, 43, '[MEETING] Cancelled the meeting', 2, '2025-08-31 11:16:43'),
(119, 44, '[MEETING] Cancelled the meeting', 1, '2025-08-31 11:15:35'),
(120, 45, '[MEETING] Created the Meeting', 3, '2025-08-31 11:28:15'),
(121, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-31 16:58:46'),
(122, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-31 16:58:50'),
(123, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-31 16:58:51'),
(124, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-08-31 16:58:52'),
(125, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 27, '2025-08-31 16:58:55'),
(126, 46, '[MEETING] Created the Meeting', 3, '2025-09-04 11:52:49'),
(127, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:42:27'),
(128, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:42:29'),
(129, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:42:30'),
(130, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:42:31'),
(131, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 27, '2025-09-04 12:42:34'),
(132, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:43:03'),
(133, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:43:08'),
(134, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:43:09'),
(135, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 27, '2025-09-04 12:43:10'),
(136, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 27, '2025-09-04 12:43:11'),
(137, 47, '[MEETING] Created the Meeting', 1, '2025-10-06 16:46:56'),
(138, 48, '[MEETING] Created the Meeting', 1, '2025-10-06 16:47:09'),
(139, 49, '[MEETING] Created the Meeting', 1, '2025-10-06 16:47:20'),
(140, 50, '[MEETING] Cancelled the meeting', 1, '2025-10-11 18:05:08'),
(141, 51, '[MEETING] Created the Meeting', 1, '2025-10-06 16:55:12'),
(142, 48, '[REMINDER] Upcoming meeting', 1, '2025-10-07 10:26:32'),
(143, 49, '[REMINDER] Upcoming meeting', 1, '2025-10-07 10:26:32'),
(144, 47, '[REMINDER] Upcoming meeting', 1, '2025-10-14 08:47:51'),
(145, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 5, '2025-10-14 17:09:45'),
(146, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 5, '2025-10-14 17:09:52'),
(147, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 5, '2025-10-14 17:10:07'),
(148, NULL, '[QUARTERLY PROGRESS] Finalized a Quarterly Progress', 5, '2025-10-14 17:10:18'),
(149, NULL, '[OVERALL PROGRESS] Finalized an Overall progress', 5, '2025-10-14 17:10:26'),
(150, 52, '[MEETING] Created the Meeting', 1, '2025-10-15 08:55:22'),
(151, 53, '[MEETING] Cancelled the meeting', 1, '2025-10-15 08:56:03'),
(152, 54, '[MEETING] Updated and rescheduled the meeting', 1, '2025-10-15 08:57:12'),
(153, 55, '[MEETING] Updated and rescheduled the meeting', 1, '2025-10-15 08:58:55'),
(154, 56, '[MEETING] Created the Meeting', 3, '2025-10-15 09:14:03'),
(155, 57, '[MEETING] Updated and rescheduled the meeting', 3, '2025-10-15 09:14:42'),
(156, 58, '[MEETING] Cancelled the meeting', 1, '2025-10-15 09:15:40'),
(157, 59, '[MEETING] Updated and rescheduled the meeting', 3, '2025-10-15 09:17:25'),
(158, 60, '[ONE ON ONE MEETING] Created the Meeting', 27, '2025-10-15 09:24:31'),
(159, 61, '[MEETING] Cancelled the meeting', 1, '2025-10-15 09:26:49'),
(160, 62, '[MEETING] Cancelled the meeting', 1, '2025-10-15 09:26:14'),
(161, 63, '[ONE ON ONE MEETING] Rescheduled the meeting', 27, '2025-10-15 09:25:22'),
(162, 64, '[MEETING] Cancelled the meeting', 3, '2025-10-15 09:28:07'),
(163, 54, '[REMINDER] Upcoming meeting', 1, '2025-10-17 08:42:12'),
(164, 65, '[ONE ON ONE MEETING] Created the Meeting', 5, '2025-10-19 16:20:39'),
(165, 52, '[REMINDER] Upcoming meeting', 1, '2025-10-21 14:25:48'),
(166, 60, '[REMINDER] Upcoming meeting', 27, '2025-10-22 12:08:36'),
(167, 59, '[REMINDER] Upcoming meeting', 3, '2025-10-23 04:12:01');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notification_admin_views`
--

CREATE TABLE `tbl_notification_admin_views` (
  `user_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_notification_admin_views`
--

INSERT INTO `tbl_notification_admin_views` (`user_id`, `notification_id`, `viewed_at`) VALUES
(1, 1, '2025-08-19 19:56:30'),
(1, 2, '2025-08-19 19:56:30'),
(1, 3, '2025-08-19 19:56:30'),
(1, 4, '2025-08-19 19:56:30'),
(1, 5, '2025-08-19 19:56:30'),
(1, 6, '2025-08-19 19:56:30'),
(1, 8, '2025-08-19 19:56:30'),
(1, 9, '2025-08-19 19:56:30'),
(1, 10, '2025-08-19 19:56:30'),
(1, 11, '2025-08-19 19:56:30'),
(1, 12, '2025-08-19 19:56:30'),
(1, 13, '2025-08-19 19:56:30'),
(1, 14, '2025-08-19 19:56:30'),
(1, 15, '2025-08-19 19:56:30'),
(1, 16, '2025-08-19 19:56:30'),
(1, 17, '2025-08-19 19:56:30'),
(1, 19, '2025-08-19 19:56:30'),
(1, 20, '2025-08-19 19:56:30'),
(1, 22, '2025-08-19 19:56:30'),
(1, 23, '2025-08-19 19:56:30'),
(1, 24, '2025-08-19 19:56:30'),
(1, 25, '2025-08-19 19:56:30'),
(1, 26, '2025-08-19 19:56:30'),
(1, 27, '2025-08-19 19:56:30'),
(1, 28, '2025-08-19 19:56:30'),
(1, 29, '2025-08-19 19:56:30'),
(1, 30, '2025-08-19 19:56:30'),
(1, 31, '2025-08-19 19:56:30'),
(1, 32, '2025-08-19 19:56:30'),
(1, 33, '2025-08-19 19:56:30'),
(1, 34, '2025-08-19 19:56:30'),
(1, 35, '2025-08-19 19:56:30'),
(1, 36, '2025-08-19 19:56:30'),
(1, 37, '2025-08-19 19:56:30'),
(1, 38, '2025-08-19 19:56:30'),
(1, 39, '2025-08-19 19:56:30'),
(1, 40, '2025-08-19 19:56:30'),
(1, 41, '2025-08-19 19:56:30'),
(1, 42, '2025-08-19 19:56:30'),
(1, 43, '2025-08-19 19:56:30'),
(1, 44, '2025-08-19 19:56:30'),
(1, 45, '2025-08-19 19:56:30'),
(1, 46, '2025-08-19 19:56:30'),
(1, 47, '2025-08-19 19:56:30'),
(1, 48, '2025-08-19 19:56:30'),
(1, 49, '2025-08-19 19:56:30'),
(1, 50, '2025-08-19 19:56:30'),
(1, 51, '2025-08-19 19:56:30'),
(1, 52, '2025-08-19 19:56:30'),
(1, 53, '2025-08-19 19:56:30'),
(1, 54, '2025-08-19 19:56:30'),
(1, 55, '2025-08-19 19:56:30'),
(1, 56, '2025-08-19 19:56:30'),
(1, 57, '2025-08-19 19:56:30'),
(1, 58, '2025-08-19 19:56:30'),
(1, 59, '2025-08-19 19:56:30'),
(1, 60, '2025-08-19 19:56:30'),
(1, 61, '2025-08-19 19:56:30'),
(1, 62, '2025-08-19 19:56:30'),
(1, 63, '2025-08-19 19:56:30'),
(1, 64, '2025-08-19 19:56:30'),
(1, 65, '2025-08-19 19:56:30'),
(1, 66, '2025-08-19 19:56:30'),
(1, 67, '2025-08-19 19:56:30'),
(1, 68, '2025-08-19 19:56:30'),
(1, 69, '2025-08-19 19:56:30'),
(1, 73, '2025-08-19 19:56:30'),
(1, 74, '2025-08-19 19:56:30'),
(1, 75, '2025-08-19 19:56:30'),
(1, 76, '2025-08-19 19:56:30'),
(1, 77, '2025-08-19 19:56:30'),
(1, 78, '2025-08-19 19:56:30'),
(1, 79, '2025-08-19 19:56:30'),
(1, 80, '2025-08-19 19:56:30'),
(1, 81, '2025-08-19 19:56:30'),
(1, 82, '2025-08-19 19:56:30'),
(1, 83, '2025-08-19 19:56:30'),
(1, 84, '2025-08-19 19:56:30'),
(1, 85, '2025-08-19 19:56:30'),
(1, 86, '2025-08-19 19:56:30'),
(1, 87, '2025-08-19 19:56:30'),
(1, 88, '2025-08-19 19:56:30'),
(1, 89, '2025-08-19 19:56:30'),
(1, 90, '2025-08-19 19:56:30'),
(1, 91, '2025-08-19 19:56:30'),
(1, 92, '2025-08-19 19:56:30'),
(1, 93, '2025-08-19 19:56:30'),
(1, 94, '2025-08-19 19:56:30'),
(1, 95, '2025-08-19 19:56:30'),
(1, 96, '2025-08-19 19:56:30'),
(1, 97, '2025-08-19 19:56:30'),
(1, 98, '2025-08-19 19:56:30'),
(1, 99, '2025-08-19 19:56:30'),
(1, 100, '2025-08-19 19:56:30'),
(1, 101, '2025-08-19 19:56:30'),
(1, 102, '2025-08-19 19:56:30'),
(1, 103, '2025-08-19 19:56:30'),
(1, 104, '2025-08-19 19:56:30'),
(1, 105, '2025-08-19 19:56:30'),
(1, 106, '2025-08-19 19:56:30'),
(1, 107, '2025-08-19 19:56:30'),
(1, 108, '2025-08-19 19:56:30'),
(1, 109, '2025-08-19 19:56:30'),
(1, 110, '2025-08-19 19:56:30'),
(1, 111, '2025-08-19 19:56:30'),
(1, 112, '2025-08-31 16:57:31'),
(1, 113, '2025-08-31 16:57:31'),
(1, 114, '2025-08-31 16:57:31'),
(1, 115, '2025-08-31 16:57:31'),
(1, 116, '2025-08-31 16:57:31'),
(1, 117, '2025-08-31 16:57:31'),
(1, 118, '2025-08-31 16:57:31'),
(1, 119, '2025-08-31 16:57:31'),
(1, 120, '2025-08-31 16:57:31'),
(1, 121, '2025-10-06 16:46:30'),
(1, 122, '2025-10-06 16:46:30'),
(1, 123, '2025-10-06 16:46:30'),
(1, 124, '2025-10-06 16:46:30'),
(1, 125, '2025-10-06 16:46:30'),
(1, 126, '2025-10-06 16:46:30'),
(1, 127, '2025-10-06 16:46:30'),
(1, 128, '2025-10-06 16:46:30'),
(1, 129, '2025-10-06 16:46:30'),
(1, 130, '2025-10-06 16:46:30'),
(1, 131, '2025-10-06 16:46:30'),
(1, 132, '2025-10-06 16:46:30'),
(1, 133, '2025-10-06 16:46:30'),
(1, 134, '2025-10-06 16:46:30'),
(1, 135, '2025-10-06 16:46:30'),
(1, 136, '2025-10-06 16:46:30'),
(1, 137, '2025-10-06 16:49:07'),
(1, 138, '2025-10-06 16:49:07'),
(1, 139, '2025-10-06 16:49:07'),
(1, 140, '2025-10-06 16:49:07'),
(1, 141, '2025-10-06 16:57:38'),
(1, 142, '2025-10-07 10:29:15'),
(1, 143, '2025-10-07 10:29:15'),
(1, 144, '2025-10-15 08:58:36'),
(1, 145, '2025-10-15 08:58:36'),
(1, 146, '2025-10-15 08:58:36'),
(1, 147, '2025-10-15 08:58:36'),
(1, 148, '2025-10-15 08:58:36'),
(1, 149, '2025-10-15 08:58:36'),
(1, 150, '2025-10-15 08:58:36'),
(1, 151, '2025-10-15 08:58:36'),
(1, 152, '2025-10-15 08:58:36'),
(1, 153, '2025-10-15 08:58:36'),
(1, 154, '2025-10-15 09:17:39'),
(1, 155, '2025-10-15 09:17:39'),
(1, 156, '2025-10-15 09:17:39'),
(1, 157, '2025-10-15 09:17:39'),
(1, 158, '2025-10-19 13:14:49'),
(1, 159, '2025-10-19 13:14:49'),
(1, 160, '2025-10-19 13:14:49'),
(1, 161, '2025-10-19 13:14:49'),
(1, 162, '2025-10-19 13:14:49'),
(1, 163, '2025-10-19 13:14:49'),
(2, 1, '2025-08-19 19:56:45'),
(2, 2, '2025-08-19 19:56:45'),
(2, 3, '2025-08-19 19:56:45'),
(2, 4, '2025-08-19 19:56:45'),
(2, 5, '2025-08-19 19:56:45'),
(2, 6, '2025-08-19 19:56:45'),
(2, 8, '2025-08-19 19:56:45'),
(2, 9, '2025-08-19 19:56:45'),
(2, 10, '2025-08-19 19:56:45'),
(2, 11, '2025-08-19 19:56:45'),
(2, 12, '2025-08-19 19:56:45'),
(2, 13, '2025-08-19 19:56:45'),
(2, 14, '2025-08-19 19:56:45'),
(2, 15, '2025-08-19 19:56:45'),
(2, 16, '2025-08-19 19:56:45'),
(2, 17, '2025-08-19 19:56:45'),
(2, 19, '2025-08-19 19:56:45'),
(2, 20, '2025-08-19 19:56:45'),
(2, 22, '2025-08-19 19:56:45'),
(2, 23, '2025-08-19 19:56:45'),
(2, 24, '2025-08-19 19:56:45'),
(2, 25, '2025-08-19 19:56:45'),
(2, 26, '2025-08-19 19:56:45'),
(2, 27, '2025-08-19 19:56:45'),
(2, 28, '2025-08-19 19:56:45'),
(2, 29, '2025-08-19 19:56:45'),
(2, 30, '2025-08-19 19:56:45'),
(2, 31, '2025-08-19 19:56:45'),
(2, 32, '2025-08-19 19:56:45'),
(2, 33, '2025-08-19 19:56:45'),
(2, 34, '2025-08-19 19:56:45'),
(2, 35, '2025-08-19 19:56:45'),
(2, 36, '2025-08-19 19:56:45'),
(2, 37, '2025-08-19 19:56:45'),
(2, 38, '2025-08-19 19:56:45'),
(2, 39, '2025-08-19 19:56:45'),
(2, 40, '2025-08-19 19:56:45'),
(2, 41, '2025-08-19 19:56:45'),
(2, 42, '2025-08-19 19:56:45'),
(2, 43, '2025-08-19 19:56:45'),
(2, 44, '2025-08-19 19:56:45'),
(2, 45, '2025-08-19 19:56:45'),
(2, 46, '2025-08-19 19:56:45'),
(2, 47, '2025-08-19 19:56:45'),
(2, 48, '2025-08-19 19:56:45'),
(2, 49, '2025-08-19 19:56:45'),
(2, 50, '2025-08-19 19:56:45'),
(2, 51, '2025-08-19 19:56:45'),
(2, 52, '2025-08-19 19:56:45'),
(2, 53, '2025-08-19 19:56:45'),
(2, 54, '2025-08-19 19:56:45'),
(2, 55, '2025-08-19 19:56:45'),
(2, 56, '2025-08-19 19:56:45'),
(2, 57, '2025-08-19 19:56:45'),
(2, 58, '2025-08-19 19:56:45'),
(2, 59, '2025-08-19 19:56:45'),
(2, 60, '2025-08-19 19:56:45'),
(2, 61, '2025-08-19 19:56:45'),
(2, 62, '2025-08-19 19:56:45'),
(2, 63, '2025-08-19 19:56:45'),
(2, 64, '2025-08-19 19:56:45'),
(2, 65, '2025-08-19 19:56:45'),
(2, 66, '2025-08-19 19:56:45'),
(2, 67, '2025-08-19 19:56:45'),
(2, 68, '2025-08-19 19:56:45'),
(2, 69, '2025-08-19 19:56:45'),
(2, 73, '2025-08-19 19:56:45'),
(2, 74, '2025-08-19 19:56:45'),
(2, 75, '2025-08-19 19:56:45'),
(2, 76, '2025-08-19 19:56:45'),
(2, 77, '2025-08-19 19:56:45'),
(2, 78, '2025-08-19 19:56:45'),
(2, 79, '2025-08-19 19:56:45'),
(2, 80, '2025-08-19 19:56:45'),
(2, 81, '2025-08-19 19:56:45'),
(2, 82, '2025-08-19 19:56:45'),
(2, 83, '2025-08-19 19:56:45'),
(2, 84, '2025-08-19 19:56:45'),
(2, 85, '2025-08-19 19:56:45'),
(2, 86, '2025-08-19 19:56:45'),
(2, 87, '2025-08-19 19:56:45'),
(2, 88, '2025-08-19 19:56:45'),
(2, 89, '2025-08-19 19:56:45'),
(2, 90, '2025-08-19 19:56:45'),
(2, 91, '2025-08-19 19:56:45'),
(2, 92, '2025-08-19 19:56:45'),
(2, 93, '2025-08-19 19:56:45'),
(2, 94, '2025-08-19 19:56:45'),
(2, 95, '2025-08-19 19:56:45'),
(2, 96, '2025-08-19 19:56:45'),
(2, 97, '2025-08-19 19:56:45'),
(2, 98, '2025-08-19 19:56:45'),
(2, 99, '2025-08-19 19:56:45'),
(2, 100, '2025-08-19 19:56:45'),
(2, 101, '2025-08-19 19:56:45'),
(2, 102, '2025-08-19 19:56:45'),
(2, 103, '2025-08-19 19:56:45'),
(2, 104, '2025-08-19 19:56:45'),
(2, 105, '2025-08-19 19:56:45'),
(2, 106, '2025-08-19 19:56:45'),
(2, 107, '2025-08-19 19:56:45'),
(2, 108, '2025-08-19 19:56:45'),
(2, 109, '2025-08-19 19:56:45'),
(2, 110, '2025-08-19 19:56:45'),
(2, 111, '2025-08-19 19:56:45'),
(2, 112, '2025-10-11 17:58:07'),
(2, 113, '2025-10-11 17:58:07'),
(2, 114, '2025-10-11 17:58:07'),
(2, 115, '2025-10-11 17:58:07'),
(2, 116, '2025-10-11 17:58:07'),
(2, 117, '2025-10-11 17:58:07'),
(2, 118, '2025-10-11 17:58:07'),
(2, 119, '2025-10-11 17:58:07'),
(2, 120, '2025-10-11 17:58:07'),
(2, 121, '2025-10-11 17:58:07'),
(2, 122, '2025-10-11 17:58:07'),
(2, 123, '2025-10-11 17:58:07'),
(2, 124, '2025-10-11 17:58:07'),
(2, 125, '2025-10-11 17:58:07'),
(2, 126, '2025-10-11 17:58:07'),
(2, 127, '2025-10-11 17:58:07'),
(2, 128, '2025-10-11 17:58:07'),
(2, 129, '2025-10-11 17:58:07'),
(2, 130, '2025-10-11 17:58:07'),
(2, 131, '2025-10-11 17:58:07'),
(2, 132, '2025-10-11 17:58:07'),
(2, 133, '2025-10-11 17:58:07'),
(2, 134, '2025-10-11 17:58:07'),
(2, 135, '2025-10-11 17:58:07'),
(2, 136, '2025-10-11 17:58:07'),
(2, 137, '2025-10-11 17:58:07'),
(2, 138, '2025-10-11 17:58:07'),
(2, 139, '2025-10-11 17:58:07'),
(2, 140, '2025-10-11 17:58:07'),
(2, 141, '2025-10-11 17:58:07'),
(2, 142, '2025-10-11 17:58:07'),
(2, 143, '2025-10-11 17:58:07'),
(2, 144, '2025-10-17 08:42:15'),
(2, 145, '2025-10-17 08:42:15'),
(2, 146, '2025-10-17 08:42:15'),
(2, 147, '2025-10-17 08:42:15'),
(2, 148, '2025-10-17 08:42:15'),
(2, 149, '2025-10-17 08:42:15'),
(2, 150, '2025-10-17 08:42:15'),
(2, 151, '2025-10-17 08:42:15'),
(2, 152, '2025-10-17 08:42:15'),
(2, 153, '2025-10-17 08:42:15'),
(2, 154, '2025-10-17 08:42:15'),
(2, 155, '2025-10-17 08:42:15'),
(2, 156, '2025-10-17 08:42:15'),
(2, 157, '2025-10-17 08:42:15'),
(2, 158, '2025-10-17 08:42:15'),
(2, 159, '2025-10-17 08:42:15'),
(2, 160, '2025-10-17 08:42:15'),
(2, 161, '2025-10-17 08:42:15'),
(2, 162, '2025-10-17 08:42:15'),
(2, 163, '2025-10-17 08:42:15'),
(2, 164, '2025-10-22 12:08:49'),
(2, 165, '2025-10-22 12:08:49'),
(2, 166, '2025-10-22 12:08:49'),
(2, 167, '2025-10-23 04:12:06');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notification_recipients`
--

CREATE TABLE `tbl_notification_recipients` (
  `recipient_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipient_type` enum('Teacher','Parent') NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_notification_recipients`
--

INSERT INTO `tbl_notification_recipients` (`recipient_id`, `notification_id`, `user_id`, `recipient_type`, `is_read`, `read_at`) VALUES
(1, 1, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(2, 1, 4, 'Teacher', 0, NULL),
(3, 1, 9, 'Teacher', 0, NULL),
(4, 1, 19, 'Teacher', 0, NULL),
(5, 1, 12, 'Teacher', 0, NULL),
(6, 1, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(7, 1, 22, 'Teacher', 0, NULL),
(8, 1, 11, 'Teacher', 0, NULL),
(9, 1, 18, 'Parent', 0, NULL),
(10, 1, 7, 'Parent', 0, NULL),
(11, 1, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(12, 1, 8, 'Parent', 0, NULL),
(13, 1, 20, 'Parent', 0, NULL),
(14, 1, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(15, 1, 6, 'Parent', 0, NULL),
(16, 2, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(17, 2, 4, 'Teacher', 0, NULL),
(18, 2, 9, 'Teacher', 0, NULL),
(19, 2, 19, 'Teacher', 0, NULL),
(20, 2, 12, 'Teacher', 0, NULL),
(21, 2, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(22, 2, 22, 'Teacher', 0, NULL),
(23, 2, 11, 'Teacher', 0, NULL),
(24, 3, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(25, 3, 4, 'Teacher', 0, NULL),
(26, 3, 9, 'Teacher', 0, NULL),
(27, 3, 19, 'Teacher', 0, NULL),
(28, 3, 12, 'Teacher', 0, NULL),
(29, 3, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(30, 3, 22, 'Teacher', 0, NULL),
(31, 3, 11, 'Teacher', 0, NULL),
(32, 3, 18, 'Parent', 0, NULL),
(33, 3, 7, 'Parent', 0, NULL),
(34, 3, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(35, 3, 8, 'Parent', 0, NULL),
(36, 3, 20, 'Parent', 0, NULL),
(37, 3, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(38, 3, 6, 'Parent', 0, NULL),
(39, 4, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(40, 4, 4, 'Teacher', 0, NULL),
(41, 4, 18, 'Parent', 0, NULL),
(42, 4, 7, 'Parent', 0, NULL),
(43, 5, 4, 'Teacher', 0, NULL),
(44, 5, 9, 'Teacher', 0, NULL),
(45, 5, 20, 'Parent', 0, NULL),
(46, 5, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(47, 6, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(48, 6, 4, 'Teacher', 0, NULL),
(49, 6, 9, 'Teacher', 0, NULL),
(50, 6, 20, 'Parent', 0, NULL),
(51, 6, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(61, 8, 4, 'Teacher', 0, NULL),
(62, 8, 9, 'Teacher', 0, NULL),
(63, 8, 20, 'Parent', 0, NULL),
(64, 8, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(65, 9, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(66, 9, 4, 'Teacher', 0, NULL),
(67, 9, 9, 'Teacher', 0, NULL),
(68, 9, 20, 'Parent', 0, NULL),
(69, 9, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(70, 10, 4, 'Teacher', 0, NULL),
(71, 10, 9, 'Teacher', 0, NULL),
(72, 10, 20, 'Parent', 0, NULL),
(73, 10, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(74, 13, 23, 'Parent', 0, NULL),
(75, 13, 5, 'Teacher', 0, NULL),
(76, 13, 10, 'Teacher', 0, NULL),
(77, 14, 7, 'Parent', 0, NULL),
(78, 14, 5, 'Teacher', 0, NULL),
(79, 14, 10, 'Teacher', 0, NULL),
(80, 15, 23, 'Parent', 0, NULL),
(81, 15, 5, 'Teacher', 0, NULL),
(82, 15, 10, 'Teacher', 0, NULL),
(83, 17, 5, 'Teacher', 0, NULL),
(84, 17, 4, 'Teacher', 0, NULL),
(85, 17, 9, 'Teacher', 0, NULL),
(86, 17, 19, 'Teacher', 0, NULL),
(87, 17, 12, 'Teacher', 0, NULL),
(88, 17, 10, 'Teacher', 0, NULL),
(89, 17, 22, 'Teacher', 0, NULL),
(90, 17, 11, 'Teacher', 0, NULL),
(91, 17, 18, 'Parent', 0, NULL),
(92, 17, 7, 'Parent', 0, NULL),
(93, 17, 23, 'Parent', 0, NULL),
(94, 17, 8, 'Parent', 0, NULL),
(95, 17, 20, 'Parent', 0, NULL),
(96, 17, 25, 'Parent', 0, NULL),
(97, 17, 6, 'Parent', 0, NULL),
(100, 19, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(101, 19, 4, 'Teacher', 0, NULL),
(102, 19, 9, 'Teacher', 0, NULL),
(103, 19, 19, 'Teacher', 0, NULL),
(104, 19, 12, 'Teacher', 0, NULL),
(105, 19, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(106, 19, 22, 'Teacher', 0, NULL),
(107, 19, 11, 'Teacher', 0, NULL),
(108, 19, 18, 'Parent', 0, NULL),
(109, 19, 7, 'Parent', 0, NULL),
(110, 19, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(111, 19, 8, 'Parent', 0, NULL),
(112, 19, 20, 'Parent', 0, NULL),
(113, 19, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(114, 19, 6, 'Parent', 0, NULL),
(115, 20, 5, 'Teacher', 0, NULL),
(116, 20, 4, 'Teacher', 0, NULL),
(117, 20, 9, 'Teacher', 0, NULL),
(118, 20, 19, 'Teacher', 0, NULL),
(119, 20, 12, 'Teacher', 0, NULL),
(120, 20, 10, 'Teacher', 0, NULL),
(121, 20, 22, 'Teacher', 0, NULL),
(122, 20, 11, 'Teacher', 0, NULL),
(123, 20, 18, 'Parent', 0, NULL),
(124, 20, 7, 'Parent', 0, NULL),
(125, 20, 23, 'Parent', 0, NULL),
(126, 20, 8, 'Parent', 0, NULL),
(127, 20, 20, 'Parent', 0, NULL),
(128, 20, 25, 'Parent', 0, NULL),
(129, 20, 6, 'Parent', 0, NULL),
(130, 22, 23, 'Parent', 0, NULL),
(131, 22, 5, 'Teacher', 0, NULL),
(132, 22, 10, 'Teacher', 0, NULL),
(136, 23, 23, 'Parent', 0, NULL),
(137, 23, 5, 'Teacher', 0, NULL),
(138, 23, 10, 'Teacher', 0, NULL),
(139, 25, 22, 'Teacher', 0, NULL),
(140, 25, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(141, 25, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(142, 25, 4, 'Teacher', 0, NULL),
(143, 25, 9, 'Teacher', 0, NULL),
(144, 25, 19, 'Teacher', 0, NULL),
(145, 25, 12, 'Teacher', 0, NULL),
(146, 25, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(147, 25, 11, 'Teacher', 0, NULL),
(148, 25, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(149, 25, 7, 'Parent', 0, NULL),
(150, 25, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(151, 25, 8, 'Parent', 0, NULL),
(152, 25, 20, 'Parent', 0, NULL),
(153, 25, 6, 'Parent', 0, NULL),
(154, 25, 18, 'Parent', 0, NULL),
(164, 27, 25, 'Parent', 0, NULL),
(165, 27, 5, 'Teacher', 0, NULL),
(166, 28, 25, 'Parent', 0, NULL),
(167, 28, 5, 'Teacher', 0, NULL),
(168, 29, 25, 'Parent', 0, NULL),
(169, 29, 5, 'Teacher', 0, NULL),
(170, 30, 25, 'Parent', 0, NULL),
(171, 30, 5, 'Teacher', 0, NULL),
(172, 31, 25, 'Parent', 0, NULL),
(173, 31, 5, 'Teacher', 0, NULL),
(174, 32, 28, 'Parent', 0, NULL),
(175, 32, 5, 'Teacher', 0, NULL),
(176, 33, 28, 'Parent', 0, NULL),
(177, 33, 5, 'Teacher', 0, NULL),
(178, 34, 28, 'Parent', 0, NULL),
(179, 34, 5, 'Teacher', 0, NULL),
(180, 35, 28, 'Parent', 0, NULL),
(181, 35, 5, 'Teacher', 0, NULL),
(182, 36, 28, 'Parent', 0, NULL),
(183, 36, 5, 'Teacher', 0, NULL),
(184, 37, 20, 'Parent', 0, NULL),
(185, 37, 5, 'Teacher', 0, NULL),
(186, 38, 20, 'Parent', 0, NULL),
(187, 38, 5, 'Teacher', 0, NULL),
(188, 39, 20, 'Parent', 0, NULL),
(189, 39, 5, 'Teacher', 0, NULL),
(190, 40, 20, 'Parent', 0, NULL),
(191, 40, 5, 'Teacher', 0, NULL),
(192, 41, 20, 'Parent', 0, NULL),
(193, 41, 5, 'Teacher', 0, NULL),
(194, 42, 23, 'Parent', 0, NULL),
(195, 42, 5, 'Teacher', 0, NULL),
(196, 43, 7, 'Parent', 0, NULL),
(197, 43, 5, 'Teacher', 0, NULL),
(198, 44, 24, 'Parent', 0, NULL),
(199, 44, 5, 'Teacher', 0, NULL),
(200, 45, 23, 'Parent', 0, NULL),
(201, 45, 10, 'Teacher', 0, NULL),
(202, 46, 4, 'Teacher', 0, NULL),
(203, 46, 22, 'Teacher', 0, NULL),
(204, 46, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(205, 46, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(206, 46, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(207, 46, 9, 'Teacher', 0, NULL),
(208, 46, 19, 'Teacher', 0, NULL),
(209, 46, 12, 'Teacher', 0, NULL),
(210, 46, 11, 'Teacher', 0, NULL),
(211, 46, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(212, 46, 7, 'Parent', 0, NULL),
(213, 46, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(214, 46, 8, 'Parent', 0, NULL),
(215, 46, 28, 'Parent', 0, NULL),
(216, 46, 24, 'Parent', 0, NULL),
(217, 46, 20, 'Parent', 0, NULL),
(218, 46, 6, 'Parent', 0, NULL),
(219, 46, 18, 'Parent', 0, NULL),
(232, 49, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(233, 49, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(234, 49, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(235, 49, 7, 'Parent', 0, NULL),
(236, 49, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(237, 49, 28, 'Parent', 0, NULL),
(238, 49, 24, 'Parent', 0, NULL),
(239, 49, 20, 'Parent', 0, NULL),
(257, 48, 22, 'Teacher', 0, NULL),
(258, 48, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(259, 48, 9, 'Teacher', 0, NULL),
(260, 48, 19, 'Teacher', 0, NULL),
(261, 48, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(262, 48, 8, 'Parent', 0, NULL),
(263, 48, 20, 'Parent', 0, NULL),
(264, 48, 6, 'Parent', 0, NULL),
(265, 48, 18, 'Parent', 0, NULL),
(266, 51, 4, 'Teacher', 0, NULL),
(267, 51, 22, 'Teacher', 0, NULL),
(268, 51, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(269, 51, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(270, 51, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(271, 51, 9, 'Teacher', 0, NULL),
(272, 51, 19, 'Teacher', 0, NULL),
(273, 51, 12, 'Teacher', 0, NULL),
(274, 51, 11, 'Teacher', 0, NULL),
(275, 52, 4, 'Teacher', 0, NULL),
(276, 52, 22, 'Teacher', 0, NULL),
(277, 52, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(278, 52, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(279, 52, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(280, 52, 9, 'Teacher', 0, NULL),
(281, 52, 19, 'Teacher', 0, NULL),
(282, 52, 12, 'Teacher', 0, NULL),
(283, 52, 11, 'Teacher', 0, NULL),
(284, 52, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(285, 52, 7, 'Parent', 0, NULL),
(286, 52, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(287, 52, 8, 'Parent', 0, NULL),
(288, 52, 28, 'Parent', 0, NULL),
(289, 52, 24, 'Parent', 0, NULL),
(290, 52, 20, 'Parent', 0, NULL),
(291, 52, 6, 'Parent', 0, NULL),
(292, 52, 18, 'Parent', 0, NULL),
(293, 53, 22, 'Teacher', 0, NULL),
(294, 53, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(295, 53, 9, 'Teacher', 0, NULL),
(296, 53, 19, 'Teacher', 0, NULL),
(297, 53, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(298, 53, 8, 'Parent', 0, NULL),
(299, 53, 20, 'Parent', 0, NULL),
(300, 53, 6, 'Parent', 0, NULL),
(301, 53, 18, 'Parent', 0, NULL),
(302, 55, 23, 'Parent', 0, NULL),
(303, 55, 5, 'Teacher', 0, NULL),
(304, 55, 10, 'Teacher', 0, NULL),
(305, 56, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(306, 56, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(307, 56, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(308, 56, 7, 'Parent', 0, NULL),
(309, 56, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(310, 56, 28, 'Parent', 0, NULL),
(311, 56, 24, 'Parent', 0, NULL),
(312, 56, 20, 'Parent', 0, NULL),
(316, 26, 25, 'Parent', 0, NULL),
(317, 26, 5, 'Teacher', 0, NULL),
(318, 26, 10, 'Teacher', 0, NULL),
(319, 59, 7, 'Parent', 0, NULL),
(320, 59, 5, 'Teacher', 0, NULL),
(321, 59, 10, 'Teacher', 0, NULL),
(322, 63, 23, 'Parent', 0, NULL),
(323, 63, 5, 'Teacher', 0, NULL),
(324, 63, 10, 'Teacher', 0, NULL),
(325, 66, 5, 'Teacher', 0, NULL),
(326, 66, 10, 'Teacher', 0, NULL),
(327, 66, 7, 'Parent', 0, NULL),
(328, 67, 4, 'Teacher', 0, NULL),
(329, 67, 22, 'Teacher', 0, NULL),
(330, 67, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(331, 67, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(332, 67, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(333, 67, 9, 'Teacher', 0, NULL),
(334, 67, 19, 'Teacher', 0, NULL),
(335, 67, 12, 'Teacher', 0, NULL),
(336, 67, 11, 'Teacher', 0, NULL),
(337, 67, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(338, 67, 7, 'Parent', 0, NULL),
(339, 67, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(340, 67, 8, 'Parent', 0, NULL),
(341, 67, 28, 'Parent', 0, NULL),
(342, 67, 24, 'Parent', 0, NULL),
(343, 67, 20, 'Parent', 0, NULL),
(344, 67, 6, 'Parent', 0, NULL),
(345, 67, 18, 'Parent', 0, NULL),
(346, 68, 4, 'Teacher', 0, NULL),
(347, 68, 22, 'Teacher', 0, NULL),
(348, 68, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(349, 68, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(350, 68, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(351, 68, 9, 'Teacher', 0, NULL),
(352, 68, 19, 'Teacher', 0, NULL),
(353, 68, 12, 'Teacher', 0, NULL),
(354, 68, 11, 'Teacher', 0, NULL),
(355, 68, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(356, 68, 7, 'Parent', 0, NULL),
(357, 68, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(358, 68, 8, 'Parent', 0, NULL),
(359, 68, 28, 'Parent', 0, NULL),
(360, 68, 24, 'Parent', 0, NULL),
(361, 68, 20, 'Parent', 0, NULL),
(362, 68, 6, 'Parent', 0, NULL),
(363, 68, 18, 'Parent', 0, NULL),
(364, 69, 4, 'Teacher', 0, NULL),
(365, 69, 22, 'Teacher', 0, NULL),
(366, 69, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(367, 69, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(368, 69, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(369, 69, 9, 'Teacher', 0, NULL),
(370, 69, 19, 'Teacher', 0, NULL),
(371, 69, 12, 'Teacher', 0, NULL),
(372, 69, 11, 'Teacher', 0, NULL),
(373, 69, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(374, 69, 7, 'Parent', 0, NULL),
(375, 69, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(376, 69, 8, 'Parent', 0, NULL),
(377, 69, 28, 'Parent', 0, NULL),
(378, 69, 24, 'Parent', 0, NULL),
(379, 69, 20, 'Parent', 0, NULL),
(380, 69, 6, 'Parent', 0, NULL),
(381, 69, 18, 'Parent', 0, NULL),
(404, 73, 5, 'Teacher', 0, NULL),
(405, 73, 10, 'Teacher', 0, NULL),
(406, 73, 7, 'Parent', 0, NULL),
(407, 74, 23, 'Parent', 0, NULL),
(408, 74, 5, 'Teacher', 0, NULL),
(409, 74, 10, 'Teacher', 0, NULL),
(410, 78, 23, 'Parent', 0, NULL),
(411, 78, 19, 'Teacher', 0, NULL),
(412, 78, 22, 'Teacher', 0, NULL),
(413, 79, 23, 'Parent', 0, NULL),
(414, 79, 19, 'Teacher', 0, NULL),
(415, 80, 23, 'Parent', 0, NULL),
(416, 80, 19, 'Teacher', 0, NULL),
(417, 81, 23, 'Parent', 0, NULL),
(418, 81, 19, 'Teacher', 0, NULL),
(419, 82, 23, 'Parent', 0, NULL),
(420, 82, 19, 'Teacher', 0, NULL),
(421, 83, 23, 'Parent', 0, NULL),
(422, 83, 19, 'Teacher', 0, NULL),
(423, 84, 18, 'Parent', 0, NULL),
(424, 84, 19, 'Teacher', 0, NULL),
(425, 85, 18, 'Parent', 0, NULL),
(426, 85, 19, 'Teacher', 0, NULL),
(427, 86, 18, 'Parent', 0, NULL),
(428, 86, 19, 'Teacher', 0, NULL),
(429, 87, 18, 'Parent', 0, NULL),
(430, 87, 19, 'Teacher', 0, NULL),
(431, 88, 18, 'Parent', 0, NULL),
(432, 88, 19, 'Teacher', 0, NULL),
(433, 89, 8, 'Parent', 0, NULL),
(434, 89, 19, 'Teacher', 0, NULL),
(435, 90, 8, 'Parent', 0, NULL),
(436, 90, 19, 'Teacher', 0, NULL),
(437, 91, 8, 'Parent', 0, NULL),
(438, 91, 19, 'Teacher', 0, NULL),
(439, 92, 8, 'Parent', 0, NULL),
(440, 92, 19, 'Teacher', 0, NULL),
(441, 93, 8, 'Parent', 0, NULL),
(442, 93, 19, 'Teacher', 0, NULL),
(443, 94, 4, 'Teacher', 0, NULL),
(444, 94, 22, 'Teacher', 0, NULL),
(445, 94, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(446, 94, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(447, 94, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(448, 94, 9, 'Teacher', 0, NULL),
(449, 94, 19, 'Teacher', 0, NULL),
(450, 94, 12, 'Teacher', 0, NULL),
(451, 94, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(452, 94, 7, 'Parent', 0, NULL),
(453, 94, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(454, 94, 8, 'Parent', 0, NULL),
(455, 94, 28, 'Parent', 0, NULL),
(456, 94, 24, 'Parent', 0, NULL),
(457, 94, 20, 'Parent', 0, NULL),
(458, 94, 6, 'Parent', 0, NULL),
(459, 94, 18, 'Parent', 0, NULL),
(460, 95, 22, 'Teacher', 0, NULL),
(461, 95, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(462, 95, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(463, 95, 19, 'Teacher', 0, NULL),
(464, 95, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(465, 95, 7, 'Parent', 0, NULL),
(466, 95, 29, 'Parent', 0, NULL),
(467, 95, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(468, 95, 8, 'Parent', 0, NULL),
(469, 95, 28, 'Parent', 0, NULL),
(470, 95, 24, 'Parent', 0, NULL),
(471, 95, 20, 'Parent', 0, NULL),
(472, 95, 18, 'Parent', 0, NULL),
(473, 96, 22, 'Teacher', 0, NULL),
(474, 96, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(475, 96, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(476, 96, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(477, 96, 19, 'Teacher', 0, NULL),
(478, 96, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(479, 96, 7, 'Parent', 0, NULL),
(480, 96, 29, 'Parent', 0, NULL),
(481, 96, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(482, 96, 8, 'Parent', 0, NULL),
(483, 96, 28, 'Parent', 0, NULL),
(484, 96, 24, 'Parent', 0, NULL),
(485, 96, 20, 'Parent', 0, NULL),
(486, 96, 18, 'Parent', 0, NULL),
(487, 97, 22, 'Teacher', 0, NULL),
(488, 97, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(489, 97, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(490, 97, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(491, 97, 19, 'Teacher', 0, NULL),
(492, 97, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(493, 97, 7, 'Parent', 0, NULL),
(494, 97, 29, 'Parent', 0, NULL),
(495, 97, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(496, 97, 8, 'Parent', 0, NULL),
(497, 97, 28, 'Parent', 0, NULL),
(498, 97, 24, 'Parent', 0, NULL),
(499, 97, 20, 'Parent', 0, NULL),
(500, 97, 18, 'Parent', 0, NULL),
(501, 98, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(502, 98, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(503, 98, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(504, 98, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(505, 98, 7, 'Parent', 0, NULL),
(506, 98, 29, 'Parent', 0, NULL),
(507, 98, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(508, 98, 28, 'Parent', 0, NULL),
(509, 98, 24, 'Parent', 0, NULL),
(510, 98, 20, 'Parent', 0, NULL),
(511, 99, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(512, 99, 9, 'Teacher', 0, NULL),
(513, 99, 30, 'Parent', 0, NULL),
(514, 99, 6, 'Parent', 0, NULL),
(515, 100, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(516, 100, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(517, 100, 9, 'Teacher', 0, NULL),
(518, 100, 30, 'Parent', 0, NULL),
(519, 100, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(520, 100, 6, 'Parent', 0, NULL),
(521, 101, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(522, 101, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(523, 101, 9, 'Teacher', 0, NULL),
(524, 101, 30, 'Parent', 0, NULL),
(525, 101, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(526, 101, 6, 'Parent', 0, NULL),
(527, 102, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(528, 102, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(529, 102, 9, 'Teacher', 0, NULL),
(530, 102, 30, 'Parent', 0, NULL),
(531, 102, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(532, 102, 6, 'Parent', 0, NULL),
(533, 103, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(534, 103, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(535, 103, 9, 'Teacher', 0, NULL),
(536, 103, 30, 'Parent', 0, NULL),
(537, 103, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(538, 103, 6, 'Parent', 0, NULL),
(539, 104, 4, 'Teacher', 0, NULL),
(540, 104, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(541, 104, 9, 'Teacher', 0, NULL),
(542, 104, 30, 'Parent', 0, NULL),
(543, 104, 6, 'Parent', 0, NULL),
(544, 104, 18, 'Parent', 0, NULL),
(546, 105, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(547, 105, 30, 'Parent', 0, NULL),
(549, 105, 6, 'Parent', 0, NULL),
(550, 105, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(551, 105, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(552, 105, 18, 'Parent', 0, NULL),
(553, 106, 5, 'Teacher', 1, '2025-08-20 16:49:24'),
(554, 106, 10, 'Teacher', 1, '2025-08-20 16:55:18'),
(555, 106, 25, 'Parent', 1, '2025-08-20 17:45:47'),
(556, 106, 7, 'Parent', 0, NULL),
(557, 106, 29, 'Parent', 0, NULL),
(558, 106, 23, 'Parent', 1, '2025-08-20 17:00:03'),
(559, 106, 28, 'Parent', 0, NULL),
(560, 106, 24, 'Parent', 0, NULL),
(561, 106, 20, 'Parent', 0, NULL),
(562, 107, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(563, 107, 9, 'Teacher', 0, NULL),
(564, 107, 30, 'Parent', 0, NULL),
(565, 107, 6, 'Parent', 0, NULL),
(569, 109, 23, 'Parent', 0, NULL),
(570, 109, 5, 'Teacher', 0, NULL),
(571, 109, 10, 'Teacher', 0, NULL),
(575, 111, 23, 'Parent', 0, NULL),
(576, 111, 5, 'Teacher', 0, NULL),
(577, 111, 10, 'Teacher', 0, NULL),
(578, 112, 6, 'Parent', 0, NULL),
(579, 112, 27, 'Teacher', 0, NULL),
(580, 113, 6, 'Parent', 0, NULL),
(581, 113, 27, 'Teacher', 0, NULL),
(582, 114, 6, 'Parent', 0, NULL),
(583, 114, 27, 'Teacher', 0, NULL),
(586, 115, 6, 'Parent', 0, NULL),
(587, 115, 27, 'Teacher', 0, NULL),
(588, 116, 6, 'Parent', 0, NULL),
(589, 116, 27, 'Teacher', 0, NULL),
(590, 117, 22, 'Teacher', 0, NULL),
(591, 117, 19, 'Teacher', 0, NULL),
(592, 117, 34, 'Parent', 0, NULL),
(593, 117, 23, 'Parent', 1, '2025-09-01 01:07:45'),
(594, 117, 8, 'Parent', 0, NULL),
(595, 117, 18, 'Parent', 0, NULL),
(596, 118, 5, 'Teacher', 1, '2025-09-18 19:38:43'),
(597, 118, 10, 'Teacher', 0, NULL),
(598, 118, 25, 'Parent', 1, '2025-09-01 00:56:43'),
(599, 118, 7, 'Parent', 0, NULL),
(600, 118, 29, 'Parent', 0, NULL),
(601, 118, 23, 'Parent', 1, '2025-09-01 01:07:45'),
(602, 118, 28, 'Parent', 0, NULL),
(603, 118, 24, 'Parent', 0, NULL),
(604, 118, 20, 'Parent', 0, NULL),
(605, 119, 22, 'Teacher', 0, NULL),
(606, 119, 19, 'Teacher', 0, NULL),
(607, 119, 34, 'Parent', 0, NULL),
(608, 119, 23, 'Parent', 1, '2025-09-01 01:07:45'),
(609, 119, 8, 'Parent', 0, NULL),
(610, 119, 18, 'Parent', 0, NULL),
(611, 120, 4, 'Teacher', 0, NULL),
(612, 120, 36, 'Teacher', 0, NULL),
(613, 120, 12, 'Teacher', 0, NULL),
(614, 121, 33, 'Parent', 0, NULL),
(615, 121, 27, 'Teacher', 0, NULL),
(616, 122, 33, 'Parent', 0, NULL),
(617, 122, 27, 'Teacher', 0, NULL),
(618, 123, 33, 'Parent', 0, NULL),
(619, 123, 27, 'Teacher', 0, NULL),
(620, 124, 33, 'Parent', 0, NULL),
(621, 124, 27, 'Teacher', 0, NULL),
(622, 125, 33, 'Parent', 0, NULL),
(623, 125, 27, 'Teacher', 0, NULL),
(624, 126, 30, 'Parent', 0, NULL),
(625, 126, 25, 'Parent', 0, NULL),
(626, 126, 34, 'Parent', 0, NULL),
(627, 126, 21, 'Parent', 0, NULL),
(628, 126, 7, 'Parent', 0, NULL),
(629, 126, 29, 'Parent', 0, NULL),
(630, 126, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(631, 126, 8, 'Parent', 0, NULL),
(632, 126, 28, 'Parent', 0, NULL),
(633, 126, 24, 'Parent', 0, NULL),
(634, 126, 20, 'Parent', 0, NULL),
(635, 126, 32, 'Parent', 0, NULL),
(636, 126, 33, 'Parent', 0, NULL),
(637, 126, 6, 'Parent', 0, NULL),
(638, 126, 18, 'Parent', 0, NULL),
(639, 127, 6, 'Parent', 0, NULL),
(640, 127, 27, 'Teacher', 0, NULL),
(641, 128, 6, 'Parent', 0, NULL),
(642, 128, 27, 'Teacher', 0, NULL),
(643, 129, 6, 'Parent', 0, NULL),
(644, 129, 27, 'Teacher', 0, NULL),
(645, 130, 6, 'Parent', 0, NULL),
(646, 130, 27, 'Teacher', 0, NULL),
(647, 131, 6, 'Parent', 0, NULL),
(648, 131, 27, 'Teacher', 0, NULL),
(649, 132, 30, 'Parent', 0, NULL),
(650, 132, 27, 'Teacher', 0, NULL),
(651, 133, 30, 'Parent', 0, NULL),
(652, 133, 27, 'Teacher', 0, NULL),
(653, 134, 30, 'Parent', 0, NULL),
(654, 134, 27, 'Teacher', 0, NULL),
(655, 135, 30, 'Parent', 0, NULL),
(656, 135, 27, 'Teacher', 0, NULL),
(657, 136, 30, 'Parent', 0, NULL),
(658, 136, 27, 'Teacher', 0, NULL),
(659, 137, 4, 'Teacher', 0, NULL),
(660, 137, 22, 'Teacher', 0, NULL),
(661, 137, 5, 'Teacher', 1, '2025-10-07 18:30:11'),
(662, 137, 38, 'Teacher', 0, NULL),
(663, 137, 10, 'Teacher', 0, NULL),
(664, 137, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(665, 137, 9, 'Teacher', 0, NULL),
(666, 137, 19, 'Teacher', 0, NULL),
(667, 137, 12, 'Teacher', 0, NULL),
(668, 137, 36, 'Teacher', 0, NULL),
(669, 137, 30, 'Parent', 0, NULL),
(670, 137, 25, 'Parent', 0, NULL),
(671, 137, 34, 'Parent', 0, NULL),
(672, 137, 21, 'Parent', 0, NULL),
(673, 137, 7, 'Parent', 0, NULL),
(674, 137, 29, 'Parent', 0, NULL),
(675, 137, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(676, 137, 8, 'Parent', 0, NULL),
(677, 137, 28, 'Parent', 0, NULL),
(678, 137, 24, 'Parent', 0, NULL),
(679, 137, 20, 'Parent', 0, NULL),
(680, 137, 32, 'Parent', 0, NULL),
(681, 137, 33, 'Parent', 0, NULL),
(682, 137, 6, 'Parent', 0, NULL),
(683, 137, 18, 'Parent', 0, NULL),
(684, 138, 30, 'Parent', 0, NULL),
(685, 138, 25, 'Parent', 0, NULL),
(686, 138, 34, 'Parent', 0, NULL),
(687, 138, 21, 'Parent', 0, NULL),
(688, 138, 7, 'Parent', 0, NULL),
(689, 138, 29, 'Parent', 0, NULL),
(690, 138, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(691, 138, 8, 'Parent', 0, NULL),
(692, 138, 28, 'Parent', 0, NULL),
(693, 138, 24, 'Parent', 0, NULL),
(694, 138, 20, 'Parent', 0, NULL),
(695, 138, 32, 'Parent', 0, NULL),
(696, 138, 33, 'Parent', 0, NULL),
(697, 138, 6, 'Parent', 0, NULL),
(698, 138, 18, 'Parent', 0, NULL),
(699, 139, 5, 'Teacher', 1, '2025-10-07 18:30:11'),
(700, 139, 10, 'Teacher', 0, NULL),
(701, 139, 25, 'Parent', 0, NULL),
(702, 139, 7, 'Parent', 0, NULL),
(703, 139, 29, 'Parent', 0, NULL),
(704, 139, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(705, 139, 28, 'Parent', 0, NULL),
(706, 139, 24, 'Parent', 0, NULL),
(707, 139, 20, 'Parent', 0, NULL),
(708, 140, 22, 'Teacher', 0, NULL),
(709, 140, 19, 'Teacher', 0, NULL),
(710, 140, 34, 'Parent', 0, NULL),
(711, 140, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(712, 140, 8, 'Parent', 0, NULL),
(713, 141, 5, 'Teacher', 1, '2025-10-07 18:30:11'),
(714, 141, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(715, 141, 9, 'Teacher', 0, NULL),
(716, 141, 19, 'Teacher', 0, NULL),
(717, 141, 25, 'Parent', 0, NULL),
(718, 141, 23, 'Parent', 1, '2025-10-07 18:17:56'),
(719, 141, 28, 'Parent', 0, NULL),
(720, 141, 24, 'Parent', 0, NULL),
(721, 142, 30, 'Parent', 0, NULL),
(722, 142, 25, 'Parent', 0, NULL),
(723, 142, 34, 'Parent', 0, NULL),
(724, 142, 21, 'Parent', 0, NULL),
(725, 142, 7, 'Parent', 0, NULL),
(726, 142, 29, 'Parent', 0, NULL),
(727, 142, 23, 'Parent', 1, '2025-10-07 18:26:42'),
(728, 142, 8, 'Parent', 0, NULL),
(729, 142, 28, 'Parent', 0, NULL),
(730, 142, 24, 'Parent', 0, NULL),
(731, 142, 20, 'Parent', 0, NULL),
(732, 142, 32, 'Parent', 0, NULL),
(733, 142, 33, 'Parent', 0, NULL),
(734, 142, 6, 'Parent', 0, NULL),
(735, 142, 18, 'Parent', 0, NULL),
(736, 143, 5, 'Teacher', 1, '2025-10-07 18:30:11'),
(737, 143, 10, 'Teacher', 0, NULL),
(738, 143, 25, 'Parent', 0, NULL),
(739, 143, 7, 'Parent', 0, NULL),
(740, 143, 29, 'Parent', 0, NULL),
(741, 143, 23, 'Parent', 1, '2025-10-07 18:26:42'),
(742, 143, 28, 'Parent', 0, NULL),
(743, 143, 24, 'Parent', 0, NULL),
(744, 143, 20, 'Parent', 0, NULL),
(745, 144, 4, 'Teacher', 0, NULL),
(746, 144, 22, 'Teacher', 0, NULL),
(747, 144, 5, 'Teacher', 0, NULL),
(748, 144, 38, 'Teacher', 0, NULL),
(749, 144, 10, 'Teacher', 0, NULL),
(750, 144, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(751, 144, 9, 'Teacher', 0, NULL),
(752, 144, 19, 'Teacher', 0, NULL),
(753, 144, 12, 'Teacher', 0, NULL),
(754, 144, 36, 'Teacher', 0, NULL),
(755, 144, 30, 'Parent', 0, NULL),
(756, 144, 25, 'Parent', 0, NULL),
(757, 144, 34, 'Parent', 0, NULL),
(758, 144, 21, 'Parent', 0, NULL),
(759, 144, 7, 'Parent', 0, NULL),
(760, 144, 29, 'Parent', 0, NULL),
(761, 144, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(762, 144, 8, 'Parent', 0, NULL),
(763, 144, 28, 'Parent', 0, NULL),
(764, 144, 24, 'Parent', 0, NULL),
(765, 144, 20, 'Parent', 0, NULL),
(766, 144, 32, 'Parent', 0, NULL),
(767, 144, 33, 'Parent', 0, NULL),
(768, 144, 6, 'Parent', 0, NULL),
(769, 144, 18, 'Parent', 0, NULL),
(770, 145, 29, 'Parent', 0, NULL),
(771, 145, 5, 'Teacher', 0, NULL),
(772, 146, 29, 'Parent', 0, NULL),
(773, 146, 5, 'Teacher', 0, NULL),
(774, 147, 29, 'Parent', 0, NULL),
(775, 147, 5, 'Teacher', 0, NULL),
(776, 148, 29, 'Parent', 0, NULL),
(777, 148, 5, 'Teacher', 0, NULL),
(778, 149, 29, 'Parent', 0, NULL),
(779, 149, 5, 'Teacher', 0, NULL),
(780, 150, 5, 'Teacher', 0, NULL),
(781, 150, 10, 'Teacher', 0, NULL),
(782, 150, 41, 'Parent', 0, NULL),
(783, 150, 25, 'Parent', 0, NULL),
(784, 150, 7, 'Parent', 0, NULL),
(785, 150, 29, 'Parent', 0, NULL),
(786, 150, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(787, 150, 28, 'Parent', 0, NULL),
(788, 150, 24, 'Parent', 0, NULL),
(789, 150, 20, 'Parent', 0, NULL),
(790, 151, 4, 'Teacher', 0, NULL),
(791, 151, 22, 'Teacher', 0, NULL),
(792, 151, 5, 'Teacher', 0, NULL),
(793, 151, 38, 'Teacher', 0, NULL),
(794, 151, 10, 'Teacher', 0, NULL),
(795, 151, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(796, 151, 9, 'Teacher', 0, NULL),
(797, 151, 19, 'Teacher', 0, NULL),
(798, 151, 12, 'Teacher', 0, NULL),
(799, 151, 36, 'Teacher', 0, NULL),
(800, 151, 37, 'Parent', 0, NULL),
(801, 151, 41, 'Parent', 0, NULL),
(802, 151, 30, 'Parent', 0, NULL),
(803, 151, 25, 'Parent', 0, NULL),
(804, 151, 34, 'Parent', 0, NULL),
(805, 151, 21, 'Parent', 0, NULL),
(806, 151, 7, 'Parent', 0, NULL),
(807, 151, 29, 'Parent', 0, NULL),
(808, 151, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(809, 151, 8, 'Parent', 0, NULL),
(810, 151, 28, 'Parent', 0, NULL),
(811, 151, 24, 'Parent', 0, NULL),
(812, 151, 20, 'Parent', 0, NULL),
(813, 151, 32, 'Parent', 0, NULL),
(814, 151, 33, 'Parent', 0, NULL),
(815, 151, 6, 'Parent', 0, NULL),
(816, 151, 18, 'Parent', 0, NULL),
(817, 152, 5, 'Teacher', 0, NULL),
(818, 152, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(819, 153, 5, 'Teacher', 0, NULL),
(820, 153, 10, 'Teacher', 0, NULL),
(821, 153, 41, 'Parent', 0, NULL),
(822, 153, 25, 'Parent', 0, NULL),
(823, 153, 7, 'Parent', 0, NULL),
(824, 153, 29, 'Parent', 0, NULL),
(825, 153, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(826, 153, 28, 'Parent', 0, NULL),
(827, 153, 24, 'Parent', 0, NULL),
(828, 153, 20, 'Parent', 0, NULL),
(829, 154, 5, 'Teacher', 0, NULL),
(830, 154, 10, 'Teacher', 0, NULL),
(831, 154, 41, 'Parent', 0, NULL),
(832, 154, 25, 'Parent', 0, NULL),
(833, 154, 7, 'Parent', 0, NULL),
(834, 154, 29, 'Parent', 0, NULL),
(835, 154, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(836, 154, 28, 'Parent', 0, NULL),
(837, 154, 24, 'Parent', 0, NULL),
(838, 154, 20, 'Parent', 0, NULL),
(839, 155, 4, 'Teacher', 0, NULL),
(840, 155, 22, 'Teacher', 0, NULL),
(841, 155, 5, 'Teacher', 0, NULL),
(842, 155, 38, 'Teacher', 0, NULL),
(843, 155, 10, 'Teacher', 0, NULL),
(844, 155, 27, 'Teacher', 1, '2025-10-15 05:25:35'),
(845, 155, 9, 'Teacher', 0, NULL),
(846, 155, 19, 'Teacher', 0, NULL),
(847, 155, 12, 'Teacher', 0, NULL),
(848, 155, 36, 'Teacher', 0, NULL),
(849, 156, 5, 'Teacher', 0, NULL),
(850, 156, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(852, 157, 5, 'Teacher', 0, NULL),
(855, 157, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(856, 158, 30, 'Parent', 0, NULL),
(857, 158, 27, 'Teacher', 0, NULL),
(858, 158, 9, 'Teacher', 0, NULL),
(859, 159, 30, 'Parent', 0, NULL),
(860, 159, 27, 'Teacher', 0, NULL),
(861, 159, 9, 'Teacher', 0, NULL),
(862, 160, 18, 'Parent', 0, NULL),
(863, 160, 27, 'Teacher', 0, NULL),
(864, 160, 9, 'Teacher', 0, NULL),
(868, 162, 6, 'Parent', 0, NULL),
(869, 162, 27, 'Teacher', 0, NULL),
(870, 162, 9, 'Teacher', 0, NULL),
(871, 163, 5, 'Teacher', 0, NULL),
(872, 163, 23, 'Parent', 1, '2025-10-19 08:49:24'),
(873, 164, 23, 'Parent', 0, NULL),
(874, 164, 5, 'Teacher', 0, NULL),
(875, 164, 10, 'Teacher', 0, NULL),
(876, 165, 5, 'Teacher', 0, NULL),
(877, 165, 10, 'Teacher', 0, NULL),
(878, 165, 41, 'Parent', 0, NULL),
(879, 165, 25, 'Parent', 0, NULL),
(880, 165, 7, 'Parent', 0, NULL),
(881, 165, 29, 'Parent', 0, NULL),
(882, 165, 23, 'Parent', 0, NULL),
(883, 165, 28, 'Parent', 0, NULL),
(884, 165, 24, 'Parent', 0, NULL),
(885, 165, 20, 'Parent', 0, NULL),
(886, 166, 30, 'Parent', 0, NULL),
(887, 166, 27, 'Teacher', 0, NULL),
(888, 166, 9, 'Teacher', 0, NULL),
(889, 167, 5, 'Teacher', 0, NULL),
(890, 167, 23, 'Parent', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_otp_verification`
--

CREATE TABLE `tbl_otp_verification` (
  `otp_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_otp_verification`
--

INSERT INTO `tbl_otp_verification` (`otp_id`, `user_id`, `otp_code`, `expires_at`, `is_verified`) VALUES
(1, 2, '702311', '2025-06-26 16:18:28', 'No'),
(2, 2, '959987', '2025-06-26 16:18:29', 'No'),
(3, 2, '930704', '2025-06-26 16:18:33', 'No'),
(4, 2, '622810', '2025-06-26 16:19:37', 'No'),
(5, 2, '398169', '2025-06-26 16:19:38', 'No'),
(6, 2, '231679', '2025-06-26 16:19:39', 'No'),
(7, 2, '450821', '2025-06-26 16:19:47', 'No'),
(8, 2, '259213', '2025-06-26 16:19:48', 'No'),
(9, 2, '227576', '2025-06-26 16:24:36', 'Yes'),
(10, 2, '214258', '2025-06-26 16:27:10', 'Yes'),
(11, 1, '595958', '2025-06-26 16:31:29', 'No'),
(12, 1, '877520', '2025-06-26 16:31:35', 'Yes'),
(13, 1, '611028', '2025-06-26 16:35:10', 'No'),
(14, 1, '910444', '2025-06-26 16:46:26', 'Yes'),
(15, 2, '127520', '2025-06-27 18:02:48', 'No'),
(16, 5, '691203', '2025-06-29 11:24:25', 'Yes'),
(17, 2, '236904', '2025-06-30 13:56:52', 'No'),
(18, 2, '708723', '2025-06-30 14:00:23', 'No'),
(19, 2, '289317', '2025-06-30 14:04:08', 'No'),
(20, 2, '546404', '2025-06-30 14:12:03', 'No'),
(21, 23, '692069', '2025-06-30 15:06:29', 'Yes'),
(22, 2, '867187', '2025-06-30 17:41:28', 'No'),
(23, 2, '621200', '2025-06-30 17:46:26', 'No'),
(24, 17, '114499', '2025-06-30 17:47:03', 'No'),
(25, 1, '508128', '2025-07-09 13:36:26', 'Yes'),
(26, 5, '689614', '2025-07-09 13:56:37', 'Yes'),
(27, 23, '483586', '2025-07-09 14:10:11', 'Yes'),
(28, 1, '582674', '2025-07-13 12:48:10', 'Yes'),
(29, 23, '362066', '2025-07-13 12:51:19', 'Yes'),
(30, 5, '854701', '2025-07-15 07:53:27', 'No'),
(31, 5, '823320', '2025-07-15 07:54:52', 'No'),
(32, 5, '593603', '2025-07-15 07:55:16', 'No'),
(33, 5, '757554', '2025-07-15 07:57:53', 'No'),
(34, 5, '977286', '2025-07-15 07:59:22', 'Yes'),
(35, 3, '409745', '2025-07-30 09:37:59', 'Yes'),
(36, 27, '509682', '2025-07-30 09:53:39', 'Yes'),
(37, 19, '392438', '2025-07-30 10:01:12', 'Yes'),
(38, 22, '107031', '2025-07-30 10:06:03', 'Yes'),
(39, 10, '959522', '2025-07-30 10:23:09', 'Yes'),
(40, 9, '686806', '2025-07-30 10:32:52', 'Yes'),
(41, 4, '267011', '2025-07-30 10:40:21', 'Yes'),
(42, 1, '259605', '2025-07-30 10:49:55', 'Yes'),
(43, 1, '294624', '2025-07-30 11:14:50', 'No'),
(44, 1, '138066', '2025-07-30 11:29:17', 'No'),
(45, 1, '319906', '2025-07-30 11:29:30', 'No'),
(46, 1, '839131', '2025-07-30 11:38:26', 'Yes'),
(47, 25, '449262', '2025-08-12 21:11:24', 'Yes'),
(48, 31, '961901', '2025-08-12 21:18:31', 'Yes'),
(49, 28, '652311', '2025-08-20 14:48:19', 'No'),
(50, 28, '696123', '2025-08-20 14:48:49', 'No'),
(51, 28, '279270', '2025-08-20 14:49:21', 'Yes'),
(52, 2, '172124', '2025-10-11 17:51:24', 'Yes'),
(53, 3, '898650', '2025-10-19 13:33:42', 'No'),
(54, 3, '114331', '2025-10-19 13:58:27', 'No'),
(55, 1, '802288', '2025-10-19 14:08:28', 'Yes'),
(56, 1, '848505', '2025-10-19 14:10:33', 'Yes');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_overall_progress`
--

CREATE TABLE `tbl_overall_progress` (
  `overall_progress_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `advisory_id` int(11) NOT NULL,
  `overall_visual_feedback_id` int(11) NOT NULL,
  `risk_id` int(11) NOT NULL,
  `overall_avg_score` decimal(5,3) DEFAULT NULL,
  `computed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_overall_progress`
--

INSERT INTO `tbl_overall_progress` (`overall_progress_id`, `student_id`, `advisory_id`, `overall_visual_feedback_id`, `risk_id`, `overall_avg_score`, `computed_at`) VALUES
(1, 6, 2, 1, 1, 92.744, '2025-08-06 08:56:30'),
(2, 11, 2, 5, 3, 34.777, '2025-07-30 07:20:08'),
(3, 8, 2, 3, 2, 57.962, '2025-07-30 07:20:44'),
(4, 5, 3, 1, 1, 98.141, '2025-08-05 16:13:06'),
(5, 9, 3, 5, 3, 32.913, '2025-08-05 17:33:43'),
(6, 4, 3, 2, 1, 90.060, '2025-08-05 17:34:32'),
(7, 1, 1, 5, 3, 38.044, '2025-08-30 19:33:10'),
(8, 17, 1, 2, 2, 75.000, '2025-08-31 16:58:55'),
(9, 2, 1, 2, 1, 76.087, '2025-09-04 12:42:34'),
(10, 15, 1, 1, 1, 93.478, '2025-09-04 12:43:11'),
(11, 13, 2, 2, 1, 79.348, '2025-10-14 17:10:26');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_overall_progress_links`
--

CREATE TABLE `tbl_overall_progress_links` (
  `link_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `overall_progress_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_overall_progress_links`
--

INSERT INTO `tbl_overall_progress_links` (`link_id`, `card_id`, `overall_progress_id`) VALUES
(1, 5, 1),
(2, 6, 1),
(3, 7, 1),
(4, 8, 1),
(5, 1, 2),
(6, 2, 2),
(7, 4, 2),
(8, 3, 2),
(9, 9, 3),
(10, 10, 3),
(11, 11, 3),
(12, 12, 3),
(13, 16, 4),
(14, 17, 4),
(15, 18, 4),
(16, 19, 4),
(17, 20, 5),
(18, 21, 5),
(19, 22, 5),
(20, 23, 5),
(21, 24, 6),
(22, 25, 6),
(23, 26, 6),
(24, 27, 6),
(25, 28, 7),
(26, 29, 7),
(27, 30, 7),
(28, 31, 7),
(29, 32, 8),
(30, 33, 8),
(31, 34, 8),
(32, 35, 8),
(33, 36, 9),
(34, 37, 9),
(35, 38, 9),
(36, 39, 9),
(37, 40, 10),
(38, 41, 10),
(39, 42, 10),
(40, 43, 10),
(41, 44, 11),
(42, 45, 11),
(43, 46, 11),
(44, 47, 11);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_overall_summaries`
--

CREATE TABLE `tbl_overall_summaries` (
  `overall_summary_id` int(11) NOT NULL,
  `risk_id` int(11) NOT NULL,
  `summary` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_overall_summaries`
--

INSERT INTO `tbl_overall_summaries` (`overall_summary_id`, `risk_id`, `summary`) VALUES
(1, 1, 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.'),
(2, 2, 'Overall, the learner is classified as Moderate Risk, suggesting the learner requires some assistance.'),
(3, 3, 'Overall, the learner is classified as High Risk, indicating that learner needs significant support.');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_parents_profile`
--

CREATE TABLE `tbl_parents_profile` (
  `parent_profile_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `father_age` int(11) DEFAULT NULL,
  `father_occupation` varchar(100) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `mother_age` int(11) DEFAULT NULL,
  `mother_occupation` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_parents_profile`
--

INSERT INTO `tbl_parents_profile` (`parent_profile_id`, `user_id`, `father_name`, `father_age`, `father_occupation`, `mother_name`, `mother_age`, `mother_occupation`, `barangay`, `city_municipality`, `province`, `country`) VALUES
(1, 6, 'Isad Macad Tan', 35, 'Driver', 'Carla Santiago Tan', 32, 'Teacher', 'Barangay Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(2, 7, 'Bryan Jimenez Lopez', 35, 'Driver', 'Dana Lopez', 34, 'Nurse', 'Barangay Kauswagan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(3, 8, 'Elwin Paca Mendoza', 35, 'Technician', 'Elaine Dela Cruz Mendoza', 31, 'Call Center Agent', 'Barangay Balulang', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(4, 18, NULL, NULL, NULL, NULL, NULL, NULL, 'Patag', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(5, 20, NULL, NULL, NULL, NULL, NULL, NULL, 'Carmen ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(6, 21, NULL, NULL, NULL, NULL, NULL, NULL, 'Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(7, 24, NULL, NULL, NULL, NULL, NULL, NULL, 'Pagatpat', 'Cagayan de Orossss', 'Misamis Oriental', 'Philippines'),
(8, 25, 'Mando Cantilado', 30, 'Engineer', 'Lyca Round Cantilado', 30, 'Tech Specialist', 'Carmen ', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(9, 23, 'Rudgel Tagaan S', 31, 'Main Developer', 'Margareth Manongdo ', 30, 'Designer ', 'Macanhan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(10, 26, NULL, NULL, NULL, NULL, NULL, NULL, 'Barangay 8', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(11, 28, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(12, 29, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(13, 30, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(14, 31, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(15, 32, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(16, 33, NULL, NULL, NULL, NULL, NULL, NULL, 'Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(17, 34, NULL, NULL, NULL, NULL, NULL, NULL, 'Tignapoloan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(18, 37, NULL, NULL, NULL, NULL, NULL, NULL, 'Barangay 4', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(19, 39, NULL, NULL, NULL, NULL, NULL, NULL, 'Macanhan', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(20, 41, NULL, NULL, NULL, NULL, NULL, NULL, 'Carmen', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines'),
(21, 43, NULL, NULL, NULL, NULL, NULL, NULL, 'Dansolihon', 'Cagayan de Oro City', 'Misamis Oriental', 'Philippines');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_progress_cards`
--

CREATE TABLE `tbl_progress_cards` (
  `card_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `advisory_id` int(11) NOT NULL,
  `quarter_id` int(11) NOT NULL,
  `quarter_visual_feedback_id` int(11) NOT NULL,
  `risk_id` int(11) DEFAULT NULL,
  `finalized_by` int(11) NOT NULL,
  `is_finalized` tinyint(1) NOT NULL DEFAULT 0,
  `quarter_avg_score` decimal(5,3) DEFAULT NULL,
  `report_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_progress_cards`
--

INSERT INTO `tbl_progress_cards` (`card_id`, `student_id`, `advisory_id`, `quarter_id`, `quarter_visual_feedback_id`, `risk_id`, `finalized_by`, `is_finalized`, `quarter_avg_score`, `report_date`) VALUES
(1, 11, 2, 1, 4, 2, 5, 1, 39.130, '2025-07-30 07:20:04'),
(2, 11, 2, 2, 5, 3, 5, 1, 33.326, '2025-07-30 07:20:05'),
(3, 11, 2, 4, 5, 3, 5, 1, 36.217, '2025-07-30 07:20:07'),
(4, 11, 2, 3, 5, 3, 5, 1, 30.435, '2025-07-30 07:20:06'),
(5, 6, 2, 1, 2, 1, 5, 1, 88.391, '2025-07-30 07:12:55'),
(6, 6, 2, 2, 2, 1, 5, 1, 88.391, '2025-07-30 07:09:25'),
(7, 6, 2, 3, 1, 1, 5, 1, 91.304, '2025-10-07 10:30:43'),
(8, 6, 2, 4, 1, 1, 5, 1, 99.999, '2025-10-07 10:30:47'),
(9, 8, 2, 1, 3, 2, 5, 1, 68.109, '2025-07-30 07:20:41'),
(10, 8, 2, 2, 4, 2, 5, 1, 44.913, '2025-07-30 07:20:42'),
(11, 8, 2, 3, 3, 2, 5, 1, 71.000, '2025-07-30 07:20:43'),
(12, 8, 2, 4, 4, 2, 5, 1, 47.826, '2025-07-30 07:20:44'),
(13, 7, 2, 1, 2, 1, 10, 1, 73.913, '2025-07-30 09:43:10'),
(14, 3, 2, 1, 2, 1, 5, 1, 85.500, '2025-07-30 07:21:20'),
(15, 12, 2, 1, 5, 3, 5, 1, 30.435, '2025-07-30 07:21:24'),
(16, 5, 3, 1, 1, 1, 19, 1, 97.522, '2025-08-05 16:11:18'),
(17, 5, 3, 2, 1, 1, 19, 1, 99.999, '2025-08-05 16:11:20'),
(18, 5, 3, 3, 1, 1, 19, 1, 97.522, '2025-08-05 16:11:22'),
(19, 5, 3, 4, 1, 1, 19, 1, 97.522, '2025-08-05 16:11:23'),
(20, 9, 3, 1, 5, 3, 19, 1, 32.913, '2025-08-05 17:33:39'),
(21, 9, 3, 2, 5, 3, 19, 1, 32.913, '2025-08-05 17:33:40'),
(22, 9, 3, 3, 5, 3, 19, 1, 32.913, '2025-08-05 17:33:01'),
(23, 9, 3, 4, 5, 3, 19, 1, 32.913, '2025-08-05 17:33:04'),
(24, 4, 3, 1, 1, 1, 19, 1, 97.522, '2025-08-05 17:34:28'),
(25, 4, 3, 2, 1, 1, 19, 1, 92.543, '2025-08-05 17:34:28'),
(26, 4, 3, 3, 2, 1, 19, 1, 85.087, '2025-08-05 17:34:29'),
(27, 4, 3, 4, 2, 1, 19, 1, 85.087, '2025-08-05 17:34:30'),
(28, 1, 1, 1, 5, 3, 27, 1, 30.435, '2025-08-30 18:59:14'),
(29, 1, 1, 2, 4, 2, 27, 1, 52.174, '2025-08-30 18:59:23'),
(30, 1, 1, 3, 4, 2, 27, 1, 39.130, '2025-08-30 18:59:29'),
(31, 1, 1, 4, 5, 3, 27, 1, 30.435, '2025-08-30 19:30:04'),
(32, 17, 1, 1, 3, 2, 27, 1, 60.870, '2025-08-31 16:58:46'),
(33, 17, 1, 2, 1, 1, 27, 1, 95.652, '2025-08-31 16:58:50'),
(34, 17, 1, 3, 2, 1, 27, 1, 78.261, '2025-08-31 16:58:51'),
(35, 17, 1, 4, 3, 2, 27, 1, 65.217, '2025-08-31 16:58:52'),
(36, 2, 1, 1, 2, 1, 27, 1, 78.261, '2025-09-04 12:42:27'),
(37, 2, 1, 2, 2, 1, 27, 1, 73.913, '2025-09-04 12:42:29'),
(38, 2, 1, 3, 2, 1, 27, 1, 82.609, '2025-09-04 12:42:30'),
(39, 2, 1, 4, 3, 2, 27, 1, 69.565, '2025-09-04 12:42:31'),
(40, 15, 1, 1, 1, 1, 27, 1, 95.652, '2025-09-04 12:43:03'),
(41, 15, 1, 2, 1, 1, 27, 1, 91.304, '2025-09-04 12:43:08'),
(42, 15, 1, 3, 1, 1, 27, 1, 99.999, '2025-09-04 12:43:09'),
(43, 15, 1, 4, 2, 1, 27, 1, 86.957, '2025-09-04 12:43:10'),
(44, 13, 2, 1, 2, 1, 5, 1, 78.261, '2025-10-14 17:09:45'),
(45, 13, 2, 2, 2, 1, 5, 1, 78.261, '2025-10-14 17:09:52'),
(46, 13, 2, 3, 3, 2, 5, 1, 65.217, '2025-10-14 17:10:07'),
(47, 13, 2, 4, 1, 1, 5, 1, 95.652, '2025-10-14 17:10:18');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_progress_comments`
--

CREATE TABLE `tbl_progress_comments` (
  `comment_id` int(11) NOT NULL,
  `commentor_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `quarter_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_progress_comments`
--

INSERT INTO `tbl_progress_comments` (`comment_id`, `commentor_id`, `student_id`, `quarter_id`, `comment`, `created_at`, `updated_at`) VALUES
(1, 5, 11, 1, 'Nice one ka ', '2025-07-21 00:16:32', '2025-08-13 05:37:17'),
(2, 5, 6, 1, 'Edited WOW naman', '2025-07-21 00:28:10', '2025-08-13 05:37:33'),
(3, 19, 5, 1, 'Very good', '2025-08-06 00:12:53', '2025-08-06 00:12:53'),
(4, 5, 3, 1, 'Very good', '2025-08-08 18:44:32', '2025-08-08 18:44:32'),
(5, 5, 6, 2, 'Very good', '2025-10-07 18:31:06', '2025-10-07 18:31:06'),
(6, 5, 13, 2, 'Very good', '2025-10-14 13:10:00', '2025-10-14 13:10:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_progress_notification`
--

CREATE TABLE `tbl_progress_notification` (
  `progress_notif_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `quarter_id` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `parent_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `parent_read_at` datetime DEFAULT NULL,
  `lead_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `lead_read_at` datetime DEFAULT NULL,
  `assistant_is_read` tinyint(1) NOT NULL DEFAULT 0,
  `assistant_read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_progress_notification`
--

INSERT INTO `tbl_progress_notification` (`progress_notif_id`, `notification_id`, `quarter_id`, `student_id`, `parent_is_read`, `parent_read_at`, `lead_is_read`, `lead_read_at`, `assistant_is_read`, `assistant_read_at`) VALUES
(1, 27, 1, 6, 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(2, 28, 2, 6, 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(3, 29, 3, 6, 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(4, 30, 4, 6, 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(5, 31, NULL, 6, 1, '2025-08-20 17:45:47', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(6, 32, 1, 11, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(7, 33, 2, 11, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(8, 34, 3, 11, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(9, 35, 4, 11, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(10, 36, NULL, 11, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(11, 37, 1, 8, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(12, 38, 2, 8, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(13, 39, 3, 8, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(14, 40, 4, 8, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(15, 41, NULL, 8, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(16, 42, 1, 7, 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(17, 43, 1, 3, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(18, 44, 1, 12, 0, NULL, 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(19, 45, 1, 7, 1, '2025-08-20 17:00:03', 1, '2025-08-20 16:49:24', 1, '2025-08-20 16:55:18'),
(20, 79, 1, 5, 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(21, 80, 2, 5, 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(22, 81, 3, 5, 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(23, 82, 4, 5, 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(24, 83, NULL, 5, 1, '2025-08-20 17:00:03', 0, NULL, 0, NULL),
(25, 84, 1, 9, 0, NULL, 0, NULL, 0, NULL),
(26, 85, 2, 9, 0, NULL, 0, NULL, 0, NULL),
(27, 86, 3, 9, 0, NULL, 0, NULL, 0, NULL),
(28, 87, 4, 9, 0, NULL, 0, NULL, 0, NULL),
(29, 88, NULL, 9, 0, NULL, 0, NULL, 0, NULL),
(30, 89, 1, 4, 0, NULL, 0, NULL, 0, NULL),
(31, 90, 2, 4, 0, NULL, 0, NULL, 0, NULL),
(32, 91, 3, 4, 0, NULL, 0, NULL, 0, NULL),
(33, 92, 4, 4, 0, NULL, 0, NULL, 0, NULL),
(34, 93, NULL, 4, 0, NULL, 0, NULL, 0, NULL),
(35, 112, 1, 1, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(36, 113, 2, 1, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(37, 114, 3, 1, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(38, 115, 4, 1, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(39, 116, NULL, 1, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(40, 121, 1, 17, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(41, 122, 2, 17, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(42, 123, 3, 17, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(43, 124, 4, 17, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(44, 125, NULL, 17, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(45, 127, 1, 2, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(46, 128, 2, 2, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(47, 129, 3, 2, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(48, 130, 4, 2, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(49, 131, NULL, 2, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(50, 132, 1, 15, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(51, 133, 2, 15, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(52, 134, 3, 15, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(53, 135, 4, 15, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(54, 136, NULL, 15, 0, NULL, 1, '2025-10-15 05:25:35', 0, NULL),
(55, 145, 1, 13, 0, NULL, 0, NULL, 0, NULL),
(56, 146, 2, 13, 0, NULL, 0, NULL, 0, NULL),
(57, 147, 3, 13, 0, NULL, 0, NULL, 0, NULL),
(58, 148, 4, 13, 0, NULL, 0, NULL, 0, NULL),
(59, 149, NULL, 13, 0, NULL, 0, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_quarters`
--

CREATE TABLE `tbl_quarters` (
  `quarter_id` int(11) NOT NULL,
  `quarter_name` varchar(100) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_quarters`
--

INSERT INTO `tbl_quarters` (`quarter_id`, `quarter_name`, `start_date`, `end_date`) VALUES
(1, '1st Quarter', '2025-08-04', '2025-10-05'),
(2, '2nd Quarter', '2025-10-06', '2025-12-07'),
(3, '3rd Quarter', '2025-12-08', '2026-02-08'),
(4, '4th Quarter', '2026-02-09', '2026-04-14');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_quarter_feedback`
--

CREATE TABLE `tbl_quarter_feedback` (
  `quarter_feedback_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `quarter_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `visual_feedback_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_quarter_feedback`
--

INSERT INTO `tbl_quarter_feedback` (`quarter_feedback_id`, `student_id`, `quarter_id`, `subject_id`, `visual_feedback_id`) VALUES
(1, 6, 1, 7, 2),
(4, 8, 1, 7, 4),
(5, 11, 1, 7, 5),
(6, 6, 1, 4, 2),
(8, 8, 1, 4, 3),
(10, 11, 1, 4, 4),
(12, 6, 1, 6, 1),
(13, 8, 1, 6, 3),
(16, 11, 1, 6, 5),
(19, 8, 1, 1, 4),
(22, 6, 1, 1, 2),
(25, 11, 1, 1, 5),
(28, 6, 1, 5, 2),
(31, 8, 1, 5, 2),
(35, 11, 1, 5, 5),
(38, 6, 1, 2, 1),
(39, 8, 1, 2, 2),
(40, 11, 1, 2, 3),
(46, 6, 2, 6, 1),
(48, 8, 2, 6, 4),
(50, 11, 2, 6, 5),
(52, 6, 2, 7, 1),
(54, 8, 2, 7, 3),
(56, 11, 2, 7, 5),
(62, 6, 2, 2, 1),
(66, 8, 2, 2, 3),
(70, 11, 2, 2, 4),
(74, 6, 2, 4, 3),
(76, 8, 2, 4, 5),
(78, 11, 2, 4, 5),
(80, 6, 2, 1, 2),
(82, 8, 2, 1, 4),
(84, 11, 2, 1, 5),
(86, 6, 2, 5, 2),
(88, 8, 2, 5, 5),
(90, 11, 2, 5, 5),
(92, 6, 3, 7, 1),
(94, 8, 3, 7, 3),
(96, 11, 3, 7, 5),
(98, 6, 3, 2, 1),
(100, 8, 3, 2, 2),
(102, 11, 3, 2, 5),
(104, 6, 3, 6, 2),
(106, 8, 3, 6, 5),
(108, 11, 3, 6, 5),
(110, 6, 3, 4, 2),
(112, 8, 3, 4, 2),
(114, 11, 3, 4, 5),
(116, 6, 3, 1, 1),
(118, 8, 3, 1, 3),
(120, 11, 3, 1, 5),
(122, 6, 3, 5, 1),
(124, 8, 3, 5, 1),
(126, 11, 3, 5, 5),
(128, 6, 4, 5, 1),
(130, 8, 4, 5, 4),
(132, 11, 4, 5, 5),
(134, 6, 4, 1, 1),
(136, 8, 4, 1, 4),
(138, 11, 4, 1, 5),
(140, 6, 4, 6, 1),
(142, 8, 4, 6, 4),
(144, 11, 4, 6, 3),
(146, 6, 4, 4, 1),
(148, 8, 4, 4, 4),
(150, 11, 4, 4, 5),
(152, 6, 4, 2, 1),
(154, 8, 4, 2, 4),
(156, 11, 4, 2, 5),
(158, 6, 4, 7, 2),
(160, 8, 4, 7, 3),
(162, 11, 4, 7, 5),
(180, 3, 1, 7, 2),
(185, 7, 1, 7, 1),
(190, 12, 1, 7, 5),
(195, 3, 1, 2, 2),
(201, 7, 1, 2, 4),
(207, 12, 1, 2, 5),
(219, 3, 1, 4, 2),
(220, 7, 1, 4, 2),
(221, 12, 1, 4, 5),
(243, 3, 1, 6, 3),
(244, 7, 1, 6, 4),
(245, 12, 1, 6, 5),
(255, 3, 1, 1, 2),
(256, 7, 1, 1, 2),
(257, 12, 1, 1, 5),
(267, 3, 1, 5, 1),
(268, 7, 1, 5, 2),
(269, 12, 1, 5, 5),
(280, 12, 2, 7, 5),
(282, 3, 2, 7, 5),
(284, 7, 2, 7, 1),
(327, 5, 1, 2, 1),
(328, 4, 1, 2, 2),
(329, 5, 1, 7, 1),
(330, 4, 1, 7, 1),
(331, 9, 1, 7, 4),
(334, 1, 1, 7, 5),
(339, 5, 1, 4, 1),
(341, 5, 1, 3, 1),
(343, 5, 1, 6, 1),
(345, 5, 1, 5, 1),
(347, 5, 1, 1, 2),
(349, 5, 2, 1, 1),
(351, 5, 3, 1, 2),
(353, 5, 4, 1, 1),
(355, 5, 4, 5, 1),
(357, 5, 3, 5, 1),
(359, 5, 2, 5, 1),
(361, 5, 2, 6, 1),
(363, 5, 3, 6, 1),
(365, 5, 3, 3, 1),
(367, 5, 4, 3, 1),
(369, 5, 2, 3, 1),
(371, 5, 4, 6, 1),
(373, 5, 4, 4, 1),
(375, 5, 3, 4, 1),
(377, 5, 2, 4, 1),
(379, 5, 4, 2, 1),
(381, 5, 3, 2, 1),
(383, 5, 2, 2, 1),
(385, 5, 2, 7, 1),
(387, 5, 3, 7, 1),
(389, 5, 4, 7, 2),
(391, 9, 1, 2, 5),
(396, 4, 2, 2, 2),
(398, 9, 2, 2, 4),
(400, 4, 3, 2, 3),
(402, 9, 3, 2, 5),
(404, 4, 4, 2, 1),
(407, 9, 4, 2, 5),
(409, 4, 4, 7, 3),
(411, 9, 4, 7, 5),
(413, 4, 3, 7, 3),
(415, 9, 3, 7, 4),
(417, 4, 2, 7, 1),
(419, 9, 2, 7, 5),
(421, 4, 1, 4, 1),
(423, 9, 1, 4, 5),
(425, 4, 2, 4, 1),
(427, 9, 2, 4, 5),
(429, 4, 3, 4, 1),
(431, 9, 3, 4, 5),
(433, 4, 4, 4, 2),
(435, 9, 4, 4, 5),
(437, 4, 4, 3, 1),
(439, 9, 4, 3, 5),
(441, 4, 3, 3, 1),
(443, 9, 3, 3, 5),
(445, 4, 2, 3, 2),
(447, 9, 2, 3, 5),
(449, 4, 1, 3, 1),
(451, 9, 1, 3, 5),
(453, 4, 1, 6, 1),
(455, 9, 1, 6, 5),
(457, 4, 2, 6, 2),
(459, 9, 2, 6, 5),
(461, 4, 3, 6, 2),
(463, 9, 3, 6, 5),
(465, 4, 4, 6, 3),
(466, 9, 4, 6, 4),
(469, 4, 1, 1, 1),
(471, 9, 1, 1, 5),
(473, 4, 2, 1, 1),
(475, 9, 2, 1, 5),
(477, 4, 3, 1, 2),
(479, 9, 3, 1, 5),
(481, 4, 4, 1, 1),
(483, 9, 4, 1, 5),
(485, 4, 4, 5, 2),
(487, 9, 4, 5, 5),
(489, 9, 3, 5, 5),
(491, 4, 3, 5, 1),
(493, 4, 2, 5, 1),
(495, 9, 2, 5, 5),
(500, 4, 1, 5, 1),
(502, 9, 1, 5, 5),
(511, 3, 2, 2, 1),
(543, 15, 1, 2, 1),
(545, 16, 1, 2, 1),
(547, 14, 1, 2, 4),
(549, 17, 1, 2, 3),
(551, 1, 1, 2, 5),
(553, 2, 1, 2, 1),
(555, 15, 1, 7, 1),
(557, 16, 1, 7, 3),
(559, 14, 1, 7, 3),
(561, 17, 1, 7, 4),
(563, 2, 1, 7, 1),
(566, 15, 1, 4, 1),
(568, 16, 1, 4, 4),
(570, 14, 1, 4, 2),
(572, 17, 1, 4, 4),
(574, 1, 1, 4, 5),
(576, 2, 1, 4, 2),
(580, 15, 1, 6, 1),
(582, 16, 1, 6, 3),
(584, 14, 1, 6, 4),
(586, 17, 1, 6, 2),
(588, 1, 1, 6, 5),
(590, 2, 1, 6, 3),
(592, 15, 1, 1, 2),
(594, 16, 1, 1, 2),
(596, 14, 1, 1, 1),
(598, 17, 1, 1, 4),
(600, 1, 1, 1, 5),
(603, 2, 1, 1, 3),
(605, 15, 1, 5, 1),
(607, 16, 1, 5, 1),
(609, 14, 1, 5, 3),
(611, 17, 1, 5, 3),
(613, 1, 1, 5, 1),
(615, 2, 1, 5, 1),
(617, 15, 2, 5, 1),
(619, 16, 2, 5, 1),
(621, 14, 2, 5, 1),
(623, 17, 2, 5, 1),
(625, 1, 2, 5, 4),
(627, 2, 2, 5, 4),
(629, 15, 2, 1, 1),
(631, 16, 2, 1, 1),
(633, 14, 2, 1, 1),
(635, 17, 2, 1, 1),
(637, 1, 2, 1, 4),
(639, 2, 2, 1, 4),
(641, 15, 2, 6, 2),
(643, 16, 2, 6, 3),
(645, 14, 2, 6, 3),
(647, 17, 2, 6, 2),
(649, 1, 2, 6, 2),
(651, 2, 2, 6, 1),
(653, 15, 2, 4, 1),
(655, 16, 2, 4, 1),
(657, 14, 2, 4, 2),
(659, 17, 2, 4, 1),
(661, 1, 2, 4, 4),
(664, 2, 2, 4, 4),
(666, 15, 2, 7, 1),
(668, 16, 2, 7, 2),
(670, 14, 2, 7, 3),
(672, 17, 2, 7, 4),
(674, 1, 2, 7, 5),
(676, 2, 2, 7, 1),
(678, 15, 2, 2, 2),
(680, 16, 2, 2, 4),
(682, 14, 2, 2, 3),
(684, 17, 2, 2, 1),
(685, 1, 2, 2, 5),
(688, 2, 2, 2, 1),
(690, 15, 3, 2, 1),
(692, 16, 3, 2, 1),
(694, 14, 3, 2, 3),
(696, 17, 3, 2, 1),
(698, 1, 3, 2, 4),
(700, 2, 3, 2, 1),
(702, 15, 3, 7, 1),
(704, 16, 3, 7, 1),
(706, 14, 3, 7, 2),
(708, 17, 3, 7, 3),
(710, 1, 3, 7, 4),
(712, 2, 3, 7, 2),
(714, 15, 3, 4, 1),
(716, 16, 3, 4, 3),
(718, 14, 3, 4, 1),
(720, 17, 3, 4, 4),
(722, 1, 3, 4, 5),
(724, 2, 3, 4, 3),
(726, 15, 3, 6, 1),
(728, 16, 3, 6, 1),
(730, 14, 3, 6, 2),
(732, 17, 3, 6, 1),
(734, 1, 3, 6, 4),
(736, 2, 3, 6, 3),
(738, 15, 3, 1, 1),
(740, 16, 3, 1, 1),
(742, 14, 3, 1, 3),
(744, 17, 3, 1, 3),
(746, 1, 3, 1, 5),
(748, 2, 3, 1, 1),
(750, 15, 3, 5, 2),
(752, 16, 3, 5, 2),
(754, 14, 3, 5, 3),
(756, 17, 3, 5, 3),
(758, 1, 3, 5, 5),
(761, 2, 3, 5, 1),
(763, 15, 4, 5, 2),
(766, 16, 4, 5, 2),
(768, 14, 4, 5, 3),
(770, 17, 4, 5, 3),
(772, 1, 4, 5, 4),
(774, 2, 4, 5, 5),
(776, 15, 4, 1, 3),
(778, 16, 4, 1, 2),
(780, 14, 4, 1, 3),
(782, 17, 4, 1, 1),
(784, 1, 4, 1, 5),
(786, 2, 4, 1, 4),
(788, 15, 4, 6, 2),
(790, 16, 4, 6, 1),
(793, 14, 4, 6, 4),
(795, 17, 4, 6, 4),
(797, 1, 4, 6, 5),
(799, 2, 4, 6, 2),
(801, 15, 4, 4, 1),
(803, 16, 4, 4, 1),
(805, 2, 4, 4, 1),
(807, 14, 4, 4, 2),
(809, 17, 4, 4, 3),
(811, 1, 4, 4, 5),
(813, 15, 4, 7, 2),
(815, 16, 4, 7, 3),
(817, 14, 4, 7, 2),
(819, 17, 4, 7, 4),
(821, 1, 4, 7, 3),
(824, 2, 4, 7, 3),
(826, 15, 4, 2, 1),
(828, 16, 4, 2, 2),
(830, 14, 4, 2, 3),
(832, 17, 4, 2, 4),
(834, 1, 4, 2, 5),
(836, 2, 4, 2, 4),
(838, 13, 1, 2, 1),
(854, 13, 1, 7, 2),
(859, 13, 1, 4, 1),
(867, 13, 1, 6, 3),
(871, 13, 1, 1, 4),
(876, 13, 1, 5, 3),
(881, 13, 2, 5, 4),
(883, 13, 2, 1, 2),
(885, 13, 2, 4, 3),
(887, 13, 2, 6, 1),
(889, 13, 2, 7, 4),
(891, 13, 2, 2, 3),
(895, 13, 3, 2, 3),
(897, 13, 3, 7, 3),
(899, 13, 3, 4, 3),
(901, 13, 3, 6, 3),
(903, 13, 3, 1, 3),
(905, 13, 3, 5, 3),
(907, 13, 4, 5, 1),
(909, 13, 4, 1, 2),
(911, 13, 4, 6, 1),
(913, 13, 4, 4, 1),
(915, 13, 4, 7, 1),
(918, 13, 4, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_risk_levels`
--

CREATE TABLE `tbl_risk_levels` (
  `risk_id` int(11) NOT NULL,
  `risk_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_risk_levels`
--

INSERT INTO `tbl_risk_levels` (`risk_id`, `risk_name`) VALUES
(1, 'Low'),
(2, 'Moderate'),
(3, 'High');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_risk_summaries`
--

CREATE TABLE `tbl_risk_summaries` (
  `summary_id` int(11) NOT NULL,
  `risk_pattern` varchar(10) DEFAULT NULL,
  `quarter_1` varchar(50) DEFAULT NULL,
  `quarter_2` varchar(50) DEFAULT NULL,
  `quarter_3` varchar(50) DEFAULT NULL,
  `quarter_4` varchar(50) DEFAULT NULL,
  `auto_summary` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_risk_summaries`
--

INSERT INTO `tbl_risk_summaries` (`summary_id`, `risk_pattern`, `quarter_1`, `quarter_2`, `quarter_3`, `quarter_4`, `auto_summary`) VALUES
(1, 'LLLL', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong'),
(2, 'LLLM', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(3, 'LLLH', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(4, 'LLML', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(5, 'LLMM', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, maintained moderate performance'),
(6, 'LLMH', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, showed a decline in performance'),
(7, 'LLHL', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(8, 'LLHM', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(9, 'LLHH', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(10, 'LMLL', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(11, 'LMLM', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(12, 'LMLH', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(13, 'LMML', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, maintained moderate performance In Quarter 4, showed improvement in performance'),
(14, 'LMMM', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, maintained moderate performance In Quarter 4, maintained moderate performance'),
(15, 'LMMH', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, maintained moderate performance In Quarter 4, showed a decline in performance'),
(16, 'LMHL', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(17, 'LMHM', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(18, 'LMHH', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(19, 'LHLL', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(20, 'LHLM', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(21, 'LHLH', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(22, 'LHML', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed improvement in performance'),
(23, 'LHMM', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, maintained moderate performance'),
(24, 'LHMH', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(25, 'LHHL', 'Excellent / Very Good', 'Not Met', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(26, 'LHHM', 'Excellent / Very Good', 'Not Met', 'Not Met', 'Good / Need Help', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(27, 'LHHH', 'Excellent / Very Good', 'Not Met', 'Not Met', 'Not Met', 'In Quarter 1, started strong with outstanding performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, continued to perform below expectations'),
(28, 'MLLL', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong'),
(29, 'MLLM', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(30, 'MLLH', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(31, 'MLML', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(32, 'MLMM', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, maintained moderate performance'),
(33, 'MLMH', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed a decline in performance'),
(34, 'MLHL', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(35, 'MLHM', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(36, 'MLHH', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(37, 'MMLL', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(38, 'MMLM', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(39, 'MMLH', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(40, 'MMML', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, maintained moderate performance In Quarter 4, showed improvement in performance'),
(41, 'MMMM', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, maintained moderate performance In Quarter 4, maintained moderate performance'),
(42, 'MMMH', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, maintained moderate performance In Quarter 4, showed a decline in performance'),
(43, 'MMHL', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(44, 'MMHM', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(45, 'MMHH', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(46, 'MHLL', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(47, 'MHLM', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(48, 'MHLH', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(49, 'MHML', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed improvement in performance'),
(50, 'MHMM', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, maintained moderate performance'),
(51, 'MHMH', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(52, 'MHHL', 'Good / Need Help', 'Not Met', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(53, 'MHHM', 'Good / Need Help', 'Not Met', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(54, 'MHHH', 'Good / Need Help', 'Not Met', 'Not Met', 'Not Met', 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, continued to perform below expectations'),
(55, 'HLLL', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong'),
(56, 'HLLM', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(57, 'HLLH', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance'),
(58, 'HLML', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(59, 'HLMM', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, maintained moderate performance'),
(60, 'HLMH', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed a decline in performance'),
(61, 'HLHL', 'Not Met', 'Excellent / Very Good', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(62, 'HLHM', 'Not Met', 'Excellent / Very Good', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(63, 'HLHH', 'Not Met', 'Excellent / Very Good', 'Not Met', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(64, 'HMLL', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(65, 'HMLM', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(66, 'HMLH', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(67, 'HMML', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, maintained moderate performance In Quarter 4, showed improvement in performance'),
(68, 'HMMM', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, maintained moderate performance In Quarter 4, maintained moderate performance'),
(69, 'HMMH', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, maintained moderate performance In Quarter 4, showed a decline in performance'),
(70, 'HMHL', 'Not Met', 'Good / Need Help', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(71, 'HMHM', 'Not Met', 'Good / Need Help', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance'),
(72, 'HMHH', 'Not Met', 'Good / Need Help', 'Not Met', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, showed a decline in performance In Quarter 4, continued to perform below expectations'),
(73, 'HHLL', 'Not Met', 'Not Met', 'Excellent / Very Good', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, remained consistently strong'),
(74, 'HHLM', 'Not Met', 'Not Met', 'Excellent / Very Good', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(75, 'HHLH', 'Not Met', 'Not Met', 'Excellent / Very Good', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(76, 'HHML', 'Not Met', 'Not Met', 'Good / Need Help', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, showed improvement in performance'),
(77, 'HHMM', 'Not Met', 'Not Met', 'Good / Need Help', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, maintained moderate performance'),
(78, 'HHMH', 'Not Met', 'Not Met', 'Good / Need Help', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, showed improvement in performance In Quarter 4, showed a decline in performance'),
(79, 'HHHL', 'Not Met', 'Not Met', 'Not Met', 'Excellent / Very Good', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(80, 'HHHM', 'Not Met', 'Not Met', 'Not Met', 'Good / Need Help', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, continued to perform below expectations In Quarter 4, showed improvement in performance'),
(81, 'HHHH', 'Not Met', 'Not Met', 'Not Met', 'Not Met', 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, continued to perform below expectations In Quarter 4, continued to perform below expectations');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_roles`
--

CREATE TABLE `tbl_roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_roles`
--

INSERT INTO `tbl_roles` (`role_id`, `role_name`) VALUES
(1, 'Super Admin'),
(2, 'Admin'),
(3, 'Teacher'),
(4, 'Parent');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_routines`
--

CREATE TABLE `tbl_routines` (
  `routine_id` int(11) NOT NULL,
  `routine_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_routines`
--

INSERT INTO `tbl_routines` (`routine_id`, `routine_name`) VALUES
(1, 'Attendance'),
(2, 'Bubble time'),
(3, 'Circle time'),
(4, 'Goodbye'),
(5, 'Snack time'),
(6, 'Story time'),
(7, 'Wrapping up'),
(8, 'Playing'),
(12, 'Sleeping');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_schedule`
--

CREATE TABLE `tbl_schedule` (
  `schedule_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `schedule_item_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `minutes` int(11) NOT NULL,
  `start_minutes` int(11) NOT NULL,
  `end_minutes` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_schedule`
--

INSERT INTO `tbl_schedule` (`schedule_id`, `level_id`, `schedule_item_id`, `day_of_week`, `minutes`, `start_minutes`, `end_minutes`) VALUES
(1, 1, 1, 'Monday', 15, 0, 15),
(2, 1, 2, 'Monday', 15, 15, 30),
(3, 1, 3, 'Monday', 10, 30, 40),
(4, 1, 4, 'Monday', 15, 40, 55),
(5, 1, 5, 'Monday', 3, 55, 58),
(6, 1, 6, 'Monday', 2, 58, 60),
(7, 1, 7, 'Wednesday', 15, 0, 15),
(8, 1, 8, 'Wednesday', 15, 15, 30),
(9, 1, 9, 'Wednesday', 10, 30, 40),
(10, 1, 10, 'Wednesday', 15, 40, 55),
(11, 1, 11, 'Wednesday', 3, 55, 58),
(12, 1, 12, 'Wednesday', 2, 58, 60),
(13, 1, 13, 'Friday', 15, 0, 15),
(14, 1, 14, 'Friday', 15, 15, 30),
(15, 1, 15, 'Friday', 10, 30, 40),
(16, 1, 16, 'Friday', 15, 40, 55),
(17, 1, 17, 'Friday', 3, 55, 58),
(18, 1, 18, 'Friday', 2, 58, 60),
(19, 2, 19, 'Monday', 15, 0, 15),
(20, 2, 20, 'Monday', 15, 15, 30),
(21, 2, 21, 'Monday', 10, 30, 40),
(22, 2, 22, 'Monday', 15, 40, 55),
(23, 2, 23, 'Monday', 3, 55, 58),
(24, 2, 24, 'Monday', 2, 58, 60),
(25, 2, 25, 'Wednesday', 15, 0, 15),
(26, 2, 26, 'Wednesday', 15, 15, 30),
(27, 2, 27, 'Wednesday', 10, 30, 40),
(28, 2, 28, 'Wednesday', 15, 40, 55),
(29, 2, 29, 'Wednesday', 3, 55, 58),
(30, 2, 30, 'Wednesday', 2, 58, 60),
(31, 2, 31, 'Friday', 15, 0, 15),
(32, 2, 32, 'Friday', 15, 15, 30),
(33, 2, 33, 'Friday', 10, 30, 40),
(34, 2, 34, 'Friday', 15, 40, 55),
(35, 2, 35, 'Friday', 3, 55, 58),
(36, 2, 36, 'Friday', 2, 58, 60),
(37, 3, 37, 'Thursday', 15, 0, 15),
(38, 3, 38, 'Thursday', 15, 15, 30),
(39, 3, 39, 'Thursday', 10, 30, 40),
(40, 3, 40, 'Thursday', 15, 40, 55),
(41, 3, 41, 'Thursday', 3, 55, 58),
(42, 3, 42, 'Thursday', 2, 58, 60),
(43, 3, 43, 'Friday', 15, 0, 15),
(44, 3, 44, 'Friday', 15, 15, 30),
(45, 3, 45, 'Friday', 10, 30, 40),
(46, 3, 46, 'Friday', 15, 40, 55),
(47, 3, 47, 'Friday', 3, 55, 58),
(48, 3, 48, 'Friday', 2, 58, 60),
(49, 3, 1, 'Tuesday', 15, 0, 15),
(50, 3, 2, 'Tuesday', 15, 15, 30),
(51, 3, 3, 'Tuesday', 10, 30, 40),
(52, 3, 4, 'Tuesday', 15, 40, 55),
(53, 3, 5, 'Tuesday', 3, 55, 58),
(54, 3, 6, 'Tuesday', 2, 58, 60);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_schedule_items`
--

CREATE TABLE `tbl_schedule_items` (
  `schedule_item_id` int(11) NOT NULL,
  `item_type` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `subject_id_2` int(11) DEFAULT NULL,
  `routine_id` int(11) DEFAULT NULL,
  `routine_id_2` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_schedule_items`
--

INSERT INTO `tbl_schedule_items` (`schedule_item_id`, `item_type`, `subject_id`, `subject_id_2`, `routine_id`, `routine_id_2`) VALUES
(1, 2, NULL, NULL, 1, 3),
(2, 1, 2, 7, NULL, NULL),
(3, 2, NULL, NULL, 5, NULL),
(4, 1, 4, NULL, NULL, NULL),
(5, 2, NULL, NULL, 6, 2),
(6, 2, NULL, NULL, 7, 4),
(7, 2, NULL, NULL, 1, 3),
(8, 1, 2, 7, NULL, NULL),
(9, 2, NULL, NULL, 5, NULL),
(10, 1, 4, NULL, NULL, NULL),
(11, 2, NULL, NULL, 6, 2),
(12, 2, NULL, NULL, 7, 4),
(13, 2, NULL, NULL, 1, 3),
(14, 1, 6, NULL, NULL, NULL),
(15, 2, NULL, NULL, 5, NULL),
(16, 1, 1, 5, NULL, NULL),
(17, 2, NULL, NULL, 6, 2),
(18, 2, NULL, NULL, 7, 4),
(19, 2, NULL, NULL, 1, 3),
(20, 1, 2, 7, NULL, NULL),
(21, 2, NULL, NULL, 5, NULL),
(22, 1, 4, NULL, NULL, NULL),
(23, 2, NULL, NULL, 6, 2),
(24, 2, NULL, NULL, 7, 4),
(25, 2, NULL, NULL, 1, 3),
(26, 1, 2, 7, NULL, NULL),
(27, 2, NULL, NULL, 5, NULL),
(28, 1, 4, NULL, NULL, NULL),
(29, 2, NULL, NULL, 6, 2),
(30, 2, NULL, NULL, 7, 4),
(31, 2, NULL, NULL, 1, 3),
(32, 1, 6, NULL, NULL, NULL),
(33, 2, NULL, NULL, 5, NULL),
(34, 1, 1, 5, NULL, NULL),
(35, 2, NULL, NULL, 6, 2),
(36, 2, NULL, NULL, 7, 4),
(37, 2, NULL, NULL, 1, 3),
(38, 1, 2, 7, NULL, NULL),
(39, 2, NULL, NULL, 5, NULL),
(40, 1, 3, NULL, NULL, NULL),
(41, 2, NULL, NULL, 6, 2),
(42, 2, NULL, NULL, 7, 4),
(43, 2, NULL, NULL, 1, 3),
(44, 1, 6, NULL, NULL, NULL),
(45, 2, NULL, NULL, 5, NULL),
(46, 1, 1, 5, NULL, NULL),
(47, 2, NULL, NULL, 6, 2),
(48, 2, NULL, NULL, 7, 4),
(49, 2, NULL, NULL, 1, 3),
(50, 1, 2, 7, NULL, NULL),
(51, 2, NULL, NULL, 5, NULL),
(52, 1, 4, NULL, NULL, NULL),
(53, 2, NULL, NULL, 6, 2),
(54, 2, NULL, NULL, 7, 4);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shapes`
--

CREATE TABLE `tbl_shapes` (
  `shape_id` int(11) NOT NULL,
  `shape_form` varchar(50) NOT NULL,
  `shape_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_shapes`
--

INSERT INTO `tbl_shapes` (`shape_id`, `shape_form`, `shape_name`) VALUES
(1, '♥', 'Heart'),
(2, '★', 'Star'),
(3, '◆', 'Diamond'),
(4, '▲', 'Triangle'),
(5, '⬤', 'Circle'),
(6, '■', 'Square'),
(7, '⬢', 'Hexagon');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_students`
--

CREATE TABLE `tbl_students` (
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `parent_profile_id` int(11) DEFAULT NULL,
  `level_id` int(11) NOT NULL,
  `stud_firstname` varchar(100) NOT NULL,
  `stud_middlename` varchar(100) DEFAULT NULL,
  `stud_lastname` varchar(100) NOT NULL,
  `stud_birthdate` date NOT NULL,
  `stud_enrollment_date` date DEFAULT NULL,
  `stud_handedness` enum('Right','Left','Not Yet Established') NOT NULL DEFAULT 'Not Yet Established',
  `stud_gender` enum('Male','Female') NOT NULL,
  `stud_schedule_class` enum('Morning','Afternoon') NOT NULL,
  `stud_photo` text DEFAULT NULL,
  `stud_school_status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_students`
--

INSERT INTO `tbl_students` (`student_id`, `parent_id`, `parent_profile_id`, `level_id`, `stud_firstname`, `stud_middlename`, `stud_lastname`, `stud_birthdate`, `stud_enrollment_date`, `stud_handedness`, `stud_gender`, `stud_schedule_class`, `stud_photo`, `stud_school_status`) VALUES
(1, 6, 1, 1, 'Aiden', 'Santiago', 'Tango', '2023-11-04', '2025-06-01', 'Right', 'Male', 'Morning', 'img_noeib_Discord_blue_icon.jpg', 'Active'),
(2, 6, 1, 1, 'Mia', 'Santiago', 'Tango', '2023-11-04', '2025-06-01', 'Left', 'Female', 'Afternoon', 'default_girl_student.png', 'Active'),
(3, 7, 2, 2, 'Zoe', 'Jimenez', 'Lopez', '2021-08-06', '2025-06-01', 'Right', 'Female', 'Afternoon', 'default_girl_student.png', 'Active'),
(4, 8, 3, 3, 'Leo', 'Dela Cruz', 'Mendoza', '2021-08-04', '2025-06-01', 'Right', 'Male', 'Afternoon', 'default_boy_student.png', 'Active'),
(5, 23, 9, 3, 'Chris Grace', 'Israel', 'Bacsarsa', '2021-08-04', '2025-06-28', 'Left', 'Male', 'Afternoon', 'img_itjsh_af5755c41b65ee5647a4d371a1c62b23.jpg', 'Active'),
(6, 25, 8, 2, 'Richard', 'Montizor', 'Gamon', '2022-07-02', '2025-06-29', 'Right', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(7, 23, 9, 2, 'Tine Grace', 'Israel', 'Bacsarsa', '2022-02-07', '2025-06-28', 'Right', 'Female', 'Morning', 'img_j4ubk_pink.jpg', 'Active'),
(8, 20, 5, 2, 'Junabel', 'Paca', 'Bali', '2021-08-08', '2025-06-29', 'Not Yet Established', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(9, NULL, NULL, 3, 'Kenzo', 'Adrylle', 'Domanon', '2021-08-04', '2025-06-29', 'Left', 'Male', 'Afternoon', 'default_boy_student.png', 'Active'),
(10, 20, 5, 3, 'Arian', '', 'Undalay', '2021-08-04', '2025-06-30', 'Right', 'Male', 'Afternoon', 'default_boy_student.png', 'Inactive'),
(11, 28, 11, 2, 'Jamica', 'Mica', 'Placido', '2022-02-22', '2025-07-16', 'Right', 'Female', 'Morning', 'default_girl_student.png', 'Active'),
(12, 24, 7, 2, 'Che', '', 'Quedit', '2022-03-31', '2025-07-16', 'Right', 'Female', 'Afternoon', 'default_girl_student.png', 'Active'),
(13, 29, 12, 2, 'Gleiah', 'Jimenez', 'Madrenos', '2022-02-22', '2025-08-07', 'Right', 'Female', 'Morning', 'default_girl_student.png', 'Active'),
(14, 32, 15, 1, 'Jan', 'Cocc', 'Paca', '2023-02-27', '2025-08-07', 'Left', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(15, 30, 13, 1, 'Jen', '', 'Cabug', '2023-02-28', '2025-08-08', 'Left', 'Female', 'Morning', 'default_girl_student.png', 'Active'),
(16, 21, 6, 1, 'Kyce', '', 'Laycs', '2023-02-22', '2025-08-10', 'Left', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(17, 33, 16, 1, 'Carlos', '', 'Tacal', '2023-04-04', '2025-08-20', 'Right', 'Male', 'Afternoon', 'default_boy_student.png', 'Active'),
(18, 37, 18, 3, 'Bea', '', 'Lachica', '2021-02-22', '2025-08-22', 'Right', 'Female', 'Morning', 'default_girl_student.png', 'Active'),
(19, NULL, NULL, 2, 'Raz', '', 'Baldoza', '2022-02-22', '2025-08-22', 'Right', 'Female', 'Afternoon', 'default_girl_student.png', 'Active'),
(20, 34, 17, 3, 'C Jay', '', 'Macuse', '2021-02-22', '2025-08-22', 'Left', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(21, 18, 4, 1, 'Pia', '', 'Bali', '2023-02-22', '2025-08-22', 'Right', 'Female', 'Afternoon', 'default_girl_student.png', 'Active'),
(22, NULL, NULL, 3, 'Chadix', 'Shane', 'Montizor', '2021-04-22', '2025-08-30', 'Left', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(23, NULL, NULL, 1, 'Obe', 'Mier', 'Tas', '2023-02-22', '2025-08-31', 'Left', 'Male', 'Morning', 'default_boy_student.png', 'Active'),
(24, 41, 20, 2, 'Angely', 'Eve', 'Bogarts', '2022-02-08', '2025-10-14', 'Right', 'Female', 'Afternoon', 'default_girl_student.png', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student_assigned`
--

CREATE TABLE `tbl_student_assigned` (
  `assigned_id` int(11) NOT NULL,
  `advisory_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_student_assigned`
--

INSERT INTO `tbl_student_assigned` (`assigned_id`, `advisory_id`, `student_id`) VALUES
(96, 1, 1),
(97, 1, 2),
(98, 1, 14),
(99, 1, 15),
(100, 1, 16),
(101, 1, 17),
(102, 1, 21),
(103, 2, 3),
(104, 2, 6),
(105, 2, 7),
(106, 2, 8),
(107, 2, 11),
(108, 2, 12),
(109, 2, 13),
(110, 2, 24),
(111, 3, 4),
(112, 3, 5),
(113, 3, 18),
(114, 3, 20);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student_levels`
--

CREATE TABLE `tbl_student_levels` (
  `level_id` int(11) NOT NULL,
  `level_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_student_levels`
--

INSERT INTO `tbl_student_levels` (`level_id`, `level_name`) VALUES
(1, 'Discoverer'),
(2, 'Explorer'),
(3, 'Adventurer');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student_milestone_interpretation`
--

CREATE TABLE `tbl_student_milestone_interpretation` (
  `milestone_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `overall_progress_id` int(11) NOT NULL,
  `summary` text DEFAULT NULL,
  `overall_summary` text DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_student_milestone_interpretation`
--

INSERT INTO `tbl_student_milestone_interpretation` (`milestone_id`, `student_id`, `overall_progress_id`, `summary`, `overall_summary`, `recorded_at`) VALUES
(1, 6, 1, 'Edited In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong', 'Edited Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-08-08 11:37:28'),
(2, 11, 2, 'In Quarter 1, started with moderate performance In Quarter 2, showed a decline in performance In Quarter 3, continued to perform below expectations In Quarter 4, continued to perform below expectations', 'Overall, the learner is classified as High Risk, indicating that learner needs significant support.', '2025-07-30 07:20:08'),
(3, 8, 3, 'In Quarter 1, started with moderate performance In Quarter 2, maintained moderate performance In Quarter 3, maintained moderate performance In Quarter 4, maintained moderate performance', 'Overall, the learner is classified as Moderate Risk, suggesting the learner requires some assistance.', '2025-07-30 07:20:44'),
(4, 5, 4, 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong', 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-08-05 16:13:06'),
(5, 9, 5, 'In Quarter 1, started with challenges in performance In Quarter 2, continued to perform below expectations In Quarter 3, continued to perform below expectations In Quarter 4, continued to perform below expectations', 'Overall, the learner is classified as High Risk, indicating that learner needs significant support.', '2025-08-05 17:33:43'),
(6, 4, 6, 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong', 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-08-05 17:34:32'),
(7, 1, 7, 'In Quarter 1, started with challenges in performance In Quarter 2, showed improvement in performance In Quarter 3, maintained moderate performance In Quarter 4, showed a decline in performance', 'Overall, the learner is classified as High Risk, indicating that learner needs significant support.', '2025-08-30 19:33:10'),
(8, 17, 8, 'In Quarter 1, started with moderate performance In Quarter 2, showed improvement in performance In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance', 'Overall, the learner is classified as Moderate Risk, suggesting the learner requires some assistance.', '2025-08-31 16:58:55'),
(9, 2, 9, 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, showed a decline in performance', 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-09-04 12:42:34'),
(10, 15, 10, 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, remained consistently strong In Quarter 4, remained consistently strong', 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-09-04 12:43:11'),
(11, 13, 11, 'In Quarter 1, started strong with outstanding performance In Quarter 2, remained consistently strong In Quarter 3, showed a decline in performance In Quarter 4, showed improvement in performance', 'Overall, the learner is classified as Low Risk, indicating that the learner is progressing very well.', '2025-10-14 17:10:26');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_subjects`
--

CREATE TABLE `tbl_subjects` (
  `subject_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_subjects`
--

INSERT INTO `tbl_subjects` (`subject_id`, `subject_name`) VALUES
(1, 'Basic Life Skills'),
(2, 'Early Math'),
(3, 'Filipino'),
(4, 'Literacy'),
(5, 'Physical Activities'),
(6, 'Science'),
(7, 'Socio Emotional'),
(8, 'History'),
(10, 'Basic English'),
(11, 'Music');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_subject_overall_progress`
--

CREATE TABLE `tbl_subject_overall_progress` (
  `subject_overall_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `advisory_id` int(11) NOT NULL,
  `finalsubj_visual_feedback_id` int(11) DEFAULT NULL,
  `finalsubj_avg_score` decimal(5,3) DEFAULT NULL,
  `computed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_subject_overall_progress`
--

INSERT INTO `tbl_subject_overall_progress` (`subject_overall_id`, `student_id`, `subject_id`, `advisory_id`, `finalsubj_visual_feedback_id`, `finalsubj_avg_score`, `computed_at`) VALUES
(1, 11, 1, 2, 5, 30.435, '2025-07-29 11:23:27'),
(2, 11, 2, 2, 4, 43.478, '2025-07-29 11:23:27'),
(3, 11, 4, 2, 5, 34.783, '2025-07-29 11:23:27'),
(4, 11, 5, 2, 5, 30.435, '2025-07-29 11:23:27'),
(5, 11, 6, 2, 4, 39.130, '2025-07-29 11:23:27'),
(6, 11, 7, 2, 5, 30.435, '2025-07-29 11:23:27'),
(7, 6, 1, 2, 1, 91.304, '2025-10-07 10:30:47'),
(8, 6, 2, 2, 1, 99.999, '2025-10-07 10:30:47'),
(9, 6, 4, 2, 2, 82.609, '2025-10-07 10:30:47'),
(10, 6, 5, 2, 1, 91.304, '2025-10-07 10:30:47'),
(11, 6, 6, 2, 1, 95.652, '2025-10-07 10:30:47'),
(12, 6, 7, 2, 1, 91.304, '2025-10-07 10:30:47'),
(13, 8, 1, 2, 3, 56.522, '2025-07-21 15:00:58'),
(14, 8, 2, 2, 3, 65.217, '2025-07-21 15:00:58'),
(15, 8, 4, 2, 3, 56.522, '2025-07-21 15:00:58'),
(16, 8, 5, 2, 3, 60.870, '2025-07-21 15:00:58'),
(17, 8, 6, 2, 4, 52.174, '2025-07-21 15:00:58'),
(18, 8, 7, 2, 3, 56.522, '2025-07-21 15:00:58'),
(19, 5, 1, 3, 1, 91.304, '2025-08-05 16:11:23'),
(20, 5, 2, 3, 1, 99.999, '2025-08-05 16:11:23'),
(21, 5, 3, 3, 1, 99.999, '2025-08-05 16:11:23'),
(22, 5, 4, 3, 1, 99.999, '2025-08-05 16:11:23'),
(23, 5, 5, 3, 1, 99.999, '2025-08-05 16:11:23'),
(24, 5, 6, 3, 1, 99.999, '2025-08-05 16:11:23'),
(25, 5, 7, 3, 1, 95.652, '2025-08-05 16:11:23'),
(26, 9, 1, 3, 5, 30.435, '2025-08-05 17:33:04'),
(27, 9, 2, 3, 4, 47.826, '2025-08-05 17:33:04'),
(28, 9, 3, 3, 5, 30.435, '2025-08-05 17:33:04'),
(29, 9, 4, 3, 4, 43.478, '2025-08-05 17:33:04'),
(30, 9, 5, 3, 5, 30.435, '2025-08-05 17:33:04'),
(31, 9, 6, 3, 5, 34.783, '2025-08-05 17:33:04'),
(32, 9, 7, 3, 4, 39.130, '2025-08-05 17:33:04'),
(33, 4, 1, 3, 1, 95.652, '2025-08-05 17:34:30'),
(34, 4, 2, 3, 2, 82.609, '2025-08-05 17:34:30'),
(35, 4, 3, 3, 1, 95.652, '2025-08-05 17:34:30'),
(36, 4, 4, 3, 1, 95.652, '2025-08-05 17:34:30'),
(37, 4, 5, 3, 1, 95.652, '2025-08-05 17:34:30'),
(38, 4, 6, 3, 2, 82.609, '2025-08-05 17:34:30'),
(39, 4, 7, 3, 2, 82.609, '2025-08-05 17:34:30'),
(40, 1, 1, 1, 5, 34.783, '2025-08-30 19:30:04'),
(41, 1, 2, 1, 5, 34.783, '2025-08-30 19:30:04'),
(42, 1, 4, 1, 5, 34.783, '2025-08-30 19:30:04'),
(43, 1, 5, 1, 3, 56.522, '2025-08-30 19:30:04'),
(44, 1, 6, 1, 4, 47.826, '2025-08-30 19:30:04'),
(45, 1, 7, 1, 4, 43.478, '2025-08-30 19:30:04'),
(46, 17, 1, 1, 2, 78.261, '2025-08-31 16:58:53'),
(47, 17, 2, 1, 2, 78.261, '2025-08-31 16:58:53'),
(48, 17, 4, 1, 3, 65.217, '2025-08-31 16:58:53'),
(49, 17, 5, 1, 2, 73.913, '2025-08-31 16:58:53'),
(50, 17, 6, 1, 2, 78.261, '2025-08-31 16:58:53'),
(51, 17, 7, 1, 4, 52.174, '2025-08-31 16:58:53'),
(52, 2, 1, 1, 3, 65.217, '2025-09-04 12:42:31'),
(53, 2, 2, 1, 2, 86.957, '2025-09-04 12:42:31'),
(54, 2, 4, 1, 2, 73.913, '2025-09-04 12:42:31'),
(55, 2, 5, 1, 3, 69.565, '2025-09-04 12:42:31'),
(56, 2, 6, 1, 2, 78.261, '2025-09-04 12:42:31'),
(57, 2, 7, 1, 2, 86.957, '2025-09-04 12:42:31'),
(58, 15, 1, 1, 2, 86.957, '2025-09-04 12:43:10'),
(59, 15, 2, 1, 1, 95.652, '2025-09-04 12:43:10'),
(60, 15, 4, 1, 1, 99.999, '2025-09-04 12:43:10'),
(61, 15, 5, 1, 1, 91.304, '2025-09-04 12:43:10'),
(62, 15, 6, 1, 1, 91.304, '2025-09-04 12:43:10'),
(63, 15, 7, 1, 1, 95.652, '2025-09-04 12:43:10'),
(64, 13, 1, 2, 3, 69.565, '2025-10-14 17:10:19'),
(65, 13, 2, 2, 2, 82.609, '2025-10-14 17:10:19'),
(66, 13, 4, 2, 2, 82.609, '2025-10-14 17:10:19'),
(67, 13, 5, 2, 3, 69.565, '2025-10-14 17:10:19'),
(68, 13, 6, 2, 2, 82.609, '2025-10-14 17:10:19'),
(69, 13, 7, 2, 2, 73.913, '2025-10-14 17:10:19');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_system_logs`
--

CREATE TABLE `tbl_system_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `target_user_id` int(11) DEFAULT NULL,
  `target_student_id` int(11) DEFAULT NULL,
  `action` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_system_logs`
--

INSERT INTO `tbl_system_logs` (`log_id`, `user_id`, `target_user_id`, `target_student_id`, `action`, `timestamp`) VALUES
(1, 1, 1, NULL, 'Edited their own details.', '2025-07-09 11:23:22'),
(2, NULL, NULL, NULL, 'Unauthorized login attempt detected from IP 158.62.62.198', '2025-07-09 11:28:51'),
(3, 23, 23, NULL, 'Edited their own details.', '2025-07-09 12:28:02'),
(4, 23, 23, NULL, 'Edited their own details.', '2025-07-09 12:30:19'),
(5, 1, NULL, 7, 'Edited the details of a student profile.', '2025-07-09 13:05:39'),
(6, 23, NULL, 7, 'Edited the details of a student profile.', '2025-07-09 16:34:59'),
(7, 23, NULL, 5, 'Edited the details of a student profile.', '2025-07-09 16:43:59'),
(8, 23, NULL, 7, 'Edited the details of a student profile.', '2025-07-09 16:44:47'),
(9, 5, 5, NULL, 'Edited their own details.', '2025-07-09 16:59:35'),
(10, 1, 26, NULL, 'Created a new parent account.', '2025-07-13 10:08:32'),
(11, 1, 26, NULL, 'Edited the details of a parent account.', '2025-07-13 10:09:11'),
(12, 1, 26, NULL, 'Archived a parent account.', '2025-07-13 10:09:16'),
(13, 1, 1, NULL, 'Changed password', '2025-07-13 10:43:10'),
(14, 23, 23, NULL, 'Changed password', '2025-07-13 10:46:19'),
(15, 1, 5, NULL, 'Edited the details of a teacher account.', '2025-07-14 14:33:59'),
(16, 1, 5, NULL, 'Edited the details of a teacher account.', '2025-07-14 14:49:41'),
(17, 1, 1, NULL, 'Edited their own details.', '2025-07-14 14:51:32'),
(18, 5, 5, NULL, 'Edited their own details.', '2025-07-14 14:52:16'),
(19, 1, 23, NULL, 'Edited the details of a parent account.', '2025-07-14 14:52:59'),
(20, 1, 23, NULL, 'Edited the details of a parent account.', '2025-07-14 14:53:45'),
(21, 1, 23, NULL, 'Edited the details of a parent account.', '2025-07-14 14:56:03'),
(22, 1, 1, NULL, 'Edited their own details.', '2025-07-14 14:58:23'),
(23, 1, 2, NULL, 'Edited the details of an admin account.', '2025-07-14 15:24:15'),
(24, 1, 16, NULL, 'Edited the details of an admin account.', '2025-07-15 05:23:46'),
(25, 1, 15, NULL, 'Edited the details of an admin account.', '2025-07-15 05:24:45'),
(26, 1, 17, NULL, 'Edited the details of an admin account.', '2025-07-15 05:26:15'),
(27, 1, 19, NULL, 'Edited the details of a teacher account.', '2025-07-15 05:27:50'),
(28, 1, 22, NULL, 'Edited the details of a teacher account.', '2025-07-15 05:29:19'),
(29, 1, 18, NULL, 'Edited the details of a parent account.', '2025-07-15 05:33:29'),
(30, 1, 24, NULL, 'Edited the details of a parent account.', '2025-07-15 05:35:35'),
(31, 1, 20, NULL, 'Edited the details of a parent account.', '2025-07-15 05:36:48'),
(32, 1, 25, NULL, 'Edited the details of a parent account.', '2025-07-15 05:37:50'),
(33, 1, 21, NULL, 'Edited the details of a parent account.', '2025-07-15 05:39:18'),
(34, 1, NULL, 9, 'Edited the details of a student profile.', '2025-07-15 05:40:05'),
(35, 1, NULL, 6, 'Edited the details of a student profile.', '2025-07-15 05:40:29'),
(36, 1, NULL, 8, 'Edited the details of a student profile.', '2025-07-15 05:40:56'),
(37, 1, 2, NULL, 'Edited the details of an admin account.', '2025-07-15 05:42:41'),
(38, 1, 5, NULL, 'Edited the details of a teacher account.', '2025-07-15 05:46:50'),
(39, 5, 5, NULL, 'Changed password', '2025-07-15 05:48:27'),
(40, 1, 27, NULL, 'Created a new teacher account.', '2025-07-15 06:17:58'),
(41, 1, 23, NULL, 'Edited the details of a parent account.', '2025-07-15 06:18:47'),
(42, 1, 15, NULL, 'Edited the details of an admin account.', '2025-07-15 07:44:11'),
(43, 1, 28, NULL, 'Created a new parent account.', '2025-07-16 10:09:00'),
(44, 1, NULL, 11, 'Created a new student profile.', '2025-07-16 10:13:25'),
(46, 1, 1, NULL, 'Edited their own details.', '2025-07-21 12:29:06'),
(47, 1, 1, NULL, 'Edited their own details.', '2025-07-21 12:29:11'),
(48, 4, 4, NULL, 'Changed password', '2025-07-30 08:36:06'),
(49, 1, 1, NULL, 'Changed password', '2025-07-30 09:34:06'),
(50, 1, NULL, 10, 'Edited the details of a student profile.', '2025-07-30 10:19:56'),
(51, 1, NULL, 10, 'Archived a student profile.', '2025-07-30 10:49:52'),
(52, 1, 29, NULL, 'Created a new parent account.', '2025-08-07 11:55:05'),
(53, 1, NULL, 13, 'Created a new student profile.', '2025-08-07 11:55:43'),
(54, 1, NULL, 13, 'Edited the details of a student profile.', '2025-08-07 12:35:16'),
(55, 1, 24, NULL, 'Edited the details of a parent account.', '2025-08-07 12:35:58'),
(56, 1, 1, NULL, 'Edited their own details.', '2025-08-07 12:54:56'),
(57, 1, 1, NULL, 'Edited their own details.', '2025-08-07 13:16:56'),
(58, 1, 1, NULL, 'Edited their own details.', '2025-08-07 13:17:07'),
(59, 1, 1, NULL, 'Edited their own details.', '2025-08-07 13:20:46'),
(60, 1, 1, NULL, 'Edited their own details.', '2025-08-07 13:20:56'),
(61, 1, 21, NULL, 'Edited the details of a parent account.', '2025-08-07 13:21:19'),
(62, 1, NULL, 14, 'Created a new student profile.', '2025-08-07 18:58:21'),
(63, 1, 14, NULL, 'Archived an admin account.', '2025-08-08 14:47:51'),
(64, 1, 16, NULL, 'Archived an admin account.', '2025-08-08 14:48:02'),
(65, 1, NULL, 14, 'Archived a student profile.', '2025-08-08 15:16:36'),
(66, 1, 17, NULL, 'Archived an admin account.', '2025-08-08 15:40:17'),
(67, 1, 15, NULL, 'Archived an admin account.', '2025-08-08 15:43:08'),
(68, 1, 2, NULL, 'Archived an admin account.', '2025-08-08 15:58:06'),
(69, 1, 2, NULL, 'Restored an admin account.', '2025-08-08 16:03:35'),
(70, 1, 15, NULL, 'Restored an admin account.', '2025-08-08 16:07:08'),
(71, 1, 15, NULL, 'Archived an admin account.', '2025-08-08 16:15:40'),
(72, 1, 15, NULL, 'Restored an admin account.', '2025-08-08 16:15:56'),
(73, 1, 11, NULL, 'Archived a teacher account.', '2025-08-08 16:17:50'),
(74, 1, NULL, 14, 'Restored a student profile.', '2025-08-08 16:18:12'),
(75, 1, NULL, 15, 'Created a new student profile.', '2025-08-08 16:35:10'),
(76, 1, 30, NULL, 'Created a new parent account.', '2025-08-08 16:36:10'),
(77, 1, NULL, 10, 'Restored a student profile.', '2025-08-08 16:53:58'),
(78, 1, NULL, 10, 'Archived a student profile.', '2025-08-08 16:54:24'),
(79, 1, NULL, 16, 'Created a new student profile.', '2025-08-10 08:41:38'),
(80, 1, 31, NULL, 'Created a new parent account.', '2025-08-10 09:26:03'),
(81, 5, 5, NULL, 'Edited their own details.', '2025-08-11 13:39:41'),
(82, 1, 1, NULL, 'Edited their own details.', '2025-08-11 16:56:06'),
(83, 1, 1, NULL, 'Edited their own details.', '2025-08-11 17:05:11'),
(84, 1, 1, NULL, 'Edited their own details.', '2025-08-11 17:14:28'),
(85, 5, 5, NULL, 'Edited their own details.', '2025-08-11 17:17:11'),
(86, 1, 2, NULL, 'Edited the details of an admin account.', '2025-08-11 17:28:44'),
(87, 1, 13, NULL, 'Edited the details of an admin account.', '2025-08-11 17:31:45'),
(88, 23, 23, NULL, 'Edited their own details.', '2025-08-11 17:48:49'),
(89, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-11 18:22:22'),
(90, 23, 23, NULL, 'Edited their own details.', '2025-08-11 18:28:46'),
(91, 23, 23, NULL, 'Edited their own details.', '2025-08-11 18:34:49'),
(92, 23, 23, NULL, 'Edited their own details.', '2025-08-11 18:34:58'),
(93, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-11 18:37:58'),
(94, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-11 18:40:49'),
(95, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-11 18:58:49'),
(96, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-11 19:08:42'),
(97, 23, NULL, 7, 'Edited the details of a student profile.', '2025-08-12 07:42:37'),
(98, 25, 25, NULL, 'Changed password', '2025-08-12 19:07:05'),
(99, 25, 25, NULL, 'Edited their own details.', '2025-08-12 19:08:07'),
(100, 1, NULL, NULL, 'Login', '2025-08-23 15:26:50'),
(101, 5, NULL, NULL, 'Login', '2025-08-23 15:52:33'),
(102, 1, NULL, NULL, 'Login', '2025-08-27 10:25:28'),
(103, 1, 25, NULL, 'Archived a parent account.', '2025-08-27 10:31:09'),
(104, 1, 25, NULL, 'Restored a parent account.', '2025-08-27 10:33:07'),
(105, 1, 23, NULL, 'Archived a parent account.', '2025-08-27 10:34:00'),
(106, 1, NULL, 6, 'Archived a student profile.', '2025-08-27 10:35:17'),
(107, 1, 4, NULL, 'Archived a teacher account.', '2025-08-27 10:36:29'),
(108, 1, 26, NULL, 'Edited the details of a parent account.', '2025-08-27 10:39:35'),
(109, 1, NULL, 6, 'Restored a student profile.', '2025-08-27 10:39:54'),
(110, 1, 23, NULL, 'Restored a parent account.', '2025-08-27 10:40:34'),
(111, 1, NULL, 7, 'Restored a student profile.', '2025-08-27 10:40:42'),
(112, 1, NULL, 5, 'Restored a student profile.', '2025-08-27 10:40:47'),
(113, 1, NULL, 6, 'Archived a student profile.', '2025-08-27 10:41:15'),
(114, 5, NULL, NULL, 'Login', '2025-08-27 10:41:33'),
(115, 5, NULL, NULL, 'Logout', '2025-08-27 11:28:56'),
(448, 2, NULL, NULL, 'Login', '2025-10-21 18:30:11'),
(449, 2, NULL, NULL, 'Logout', '2025-10-21 18:50:19'),
(450, 1, NULL, NULL, 'Login', '2025-10-21 18:50:23'),
(451, 1, NULL, NULL, 'Logout', '2025-10-21 22:12:58'),
(452, 2, NULL, NULL, 'Login', '2025-10-22 12:08:32'),
(453, 2, NULL, NULL, 'Login', '2025-10-23 04:11:57'),
(454, 2, 42, NULL, 'Edited the details of a teacher account.', '2025-10-23 04:14:26'),
(455, 1, NULL, NULL, 'Login', '2025-10-23 04:15:58'),
(456, 2, NULL, NULL, 'Login', '2025-10-23 04:17:20'),
(457, 1, 1, NULL, 'Edited their own details.', '2025-10-23 04:20:46'),
(458, 1, NULL, NULL, 'Logout', '2025-10-23 04:24:14'),
(459, 2, NULL, NULL, 'Login', '2025-10-23 04:24:24'),
(460, 2, NULL, NULL, 'Logout', '2025-10-23 04:28:45'),
(461, 2, NULL, NULL, 'Login', '2025-10-23 13:13:58'),
(462, 1, NULL, NULL, 'Login', '2025-10-23 14:07:21'),
(463, 1, NULL, NULL, 'Logout', '2025-10-23 14:12:02'),
(464, 31, NULL, NULL, 'Login', '2025-10-23 14:13:15'),
(465, 31, NULL, NULL, 'Logout', '2025-10-23 14:13:53'),
(466, 4, NULL, NULL, 'Login', '2025-10-23 14:14:17'),
(467, 4, NULL, NULL, 'Logout', '2025-10-23 14:14:56'),
(468, 1, NULL, NULL, 'Login', '2025-10-23 14:15:06'),
(469, 1, NULL, NULL, 'Logout', '2025-10-23 19:52:57');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tracking_adventurer`
--

CREATE TABLE `tbl_tracking_adventurer` (
  `tracking_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `visual_feedback_id` int(11) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_tracking_adventurer`
--

INSERT INTO `tbl_tracking_adventurer` (`tracking_id`, `student_id`, `activity_id`, `visual_feedback_id`, `recorded_at`) VALUES
(1, 5, 76, 1, '2025-08-01 06:25:02'),
(2, 4, 76, 2, '2025-08-01 06:29:07'),
(3, 5, 77, 2, '2025-08-05 16:00:00'),
(4, 5, 78, 2, '2025-08-07 12:20:20'),
(5, 5, 79, 1, '2025-08-07 16:00:00'),
(6, 5, 80, 1, '2025-08-08 16:00:00'),
(7, 5, 81, 1, '2025-08-09 16:00:00'),
(8, 5, 82, 1, '2025-08-10 16:00:00'),
(9, 5, 83, 1, '2025-08-11 16:00:00'),
(10, 5, 84, 1, '2025-08-12 16:00:00'),
(11, 5, 85, 1, '2025-08-13 16:00:00'),
(12, 5, 86, 2, '2025-08-14 16:00:00'),
(13, 5, 87, 1, '2025-08-15 16:00:00'),
(14, 5, 88, 1, '2025-08-16 16:00:00'),
(15, 5, 89, 1, '2025-08-17 16:00:00'),
(16, 5, 90, 1, '2025-08-18 16:00:00'),
(17, 5, 91, 1, '2025-10-07 16:00:00'),
(18, 5, 92, 2, '2025-10-08 16:00:00'),
(19, 5, 93, 1, '2025-10-09 16:00:00'),
(20, 5, 94, 2, '2025-10-10 16:00:00'),
(21, 5, 95, 1, '2025-10-11 16:00:00'),
(22, 5, 96, 2, '2025-10-12 16:00:00'),
(23, 5, 97, 1, '2025-10-13 16:00:00'),
(24, 5, 98, 2, '2025-10-14 16:00:00'),
(25, 5, 99, 1, '2025-10-15 16:00:00'),
(26, 5, 100, 2, '2025-10-16 16:00:00'),
(27, 5, 101, 1, '2025-10-17 16:00:00'),
(28, 5, 102, 1, '2025-10-18 16:00:00'),
(29, 5, 103, 1, '2025-10-19 16:00:00'),
(30, 5, 104, 2, '2025-10-20 16:00:00'),
(31, 5, 105, 2, '2025-12-09 16:00:00'),
(32, 5, 106, 2, '2025-12-10 16:00:00'),
(33, 5, 107, 1, '2025-12-11 16:00:00'),
(34, 5, 108, 2, '2025-12-12 16:00:00'),
(35, 5, 109, 1, '2025-12-13 16:00:00'),
(36, 5, 110, 1, '2025-12-14 16:00:00'),
(37, 5, 111, 1, '2025-12-15 16:00:00'),
(38, 5, 112, 2, '2025-12-16 16:00:00'),
(39, 5, 113, 1, '2025-12-17 16:00:00'),
(40, 5, 114, 1, '2025-12-18 16:00:00'),
(41, 5, 115, 1, '2025-12-19 16:00:00'),
(42, 5, 116, 1, '2025-12-20 16:00:00'),
(43, 5, 117, 1, '2025-12-21 16:00:00'),
(44, 5, 118, 2, '2025-12-22 16:00:00'),
(45, 5, 119, 2, '2026-02-10 16:00:00'),
(46, 5, 120, 1, '2026-02-11 16:00:00'),
(47, 5, 121, 1, '2026-02-12 16:00:00'),
(48, 5, 122, 2, '2026-02-13 16:00:00'),
(49, 5, 123, 1, '2026-02-14 16:00:00'),
(50, 5, 124, 1, '2026-02-15 16:00:00'),
(51, 5, 125, 1, '2026-02-16 16:00:00'),
(52, 5, 126, 2, '2026-02-17 16:00:00'),
(53, 5, 127, 2, '2026-02-18 16:00:00'),
(54, 5, 128, 1, '2026-02-19 16:00:00'),
(55, 5, 129, 1, '2026-02-20 16:00:00'),
(56, 5, 130, 1, '2026-02-21 16:00:00'),
(57, 5, 131, 2, '2026-02-22 16:00:00'),
(58, 5, 132, 2, '2026-02-23 16:00:00'),
(59, 4, 89, 2, '2025-08-01 07:28:51'),
(60, 9, 89, 4, '2025-08-01 07:28:53'),
(61, 4, 90, 1, '2025-08-01 07:28:55'),
(62, 9, 90, 4, '2025-08-01 07:28:58'),
(63, 9, 76, 5, '2025-08-05 17:21:13'),
(64, 4, 79, 2, '2025-08-05 17:21:15'),
(65, 9, 79, 5, '2025-08-05 17:21:17'),
(66, 4, 80, 3, '2025-08-05 17:21:19'),
(67, 9, 80, 5, '2025-08-05 17:21:21'),
(68, 4, 93, 2, '2025-08-05 17:21:28'),
(69, 4, 94, 2, '2025-08-05 17:21:30'),
(70, 9, 93, 4, '2025-08-05 17:21:33'),
(71, 9, 94, 3, '2025-08-05 17:21:35'),
(72, 4, 107, 2, '2025-08-05 17:21:39'),
(73, 4, 108, 3, '2025-08-05 17:21:40'),
(74, 9, 107, 4, '2025-08-05 17:21:42'),
(75, 9, 108, 5, '2025-08-05 17:21:45'),
(76, 4, 121, 1, '2025-08-05 17:21:51'),
(77, 4, 122, 1, '2025-08-05 17:21:55'),
(78, 9, 121, 5, '2025-08-05 17:21:57'),
(79, 9, 122, 5, '2025-08-05 17:21:59'),
(80, 4, 131, 2, '2025-08-05 17:22:06'),
(81, 4, 132, 3, '2025-08-05 17:22:08'),
(82, 9, 131, 5, '2025-08-05 17:22:09'),
(83, 9, 132, 5, '2025-08-05 17:22:11'),
(84, 4, 117, 2, '2025-08-05 17:22:19'),
(85, 4, 118, 4, '2025-08-05 17:22:21'),
(86, 9, 117, 3, '2025-08-05 17:22:23'),
(87, 9, 118, 5, '2025-08-05 17:22:25'),
(88, 4, 103, 1, '2025-08-05 17:22:30'),
(89, 4, 104, 2, '2025-08-05 17:22:33'),
(90, 9, 103, 5, '2025-08-05 17:22:35'),
(91, 9, 104, 4, '2025-08-05 17:22:37'),
(92, 4, 83, 1, '2025-08-05 17:22:50'),
(93, 4, 84, 2, '2025-08-05 17:22:52'),
(94, 9, 83, 4, '2025-08-05 17:22:54'),
(95, 9, 84, 5, '2025-08-05 17:22:55'),
(96, 4, 97, 2, '2025-08-05 17:23:01'),
(97, 4, 98, 1, '2025-08-05 17:23:04'),
(98, 9, 97, 5, '2025-08-05 17:23:07'),
(99, 9, 98, 5, '2025-08-05 17:23:09'),
(100, 4, 111, 2, '2025-08-05 17:23:13'),
(101, 4, 112, 1, '2025-08-05 17:23:15'),
(102, 9, 111, 4, '2025-08-05 17:23:17'),
(103, 9, 112, 5, '2025-08-05 17:23:19'),
(104, 4, 125, 2, '2025-08-05 17:23:26'),
(105, 4, 126, 2, '2025-08-05 17:23:28'),
(106, 9, 125, 5, '2025-08-05 17:23:29'),
(107, 9, 126, 5, '2025-08-05 17:23:31'),
(108, 4, 123, 1, '2025-08-05 17:24:27'),
(109, 4, 124, 2, '2025-08-05 17:24:29'),
(110, 9, 123, 4, '2025-08-05 17:24:34'),
(111, 9, 124, 5, '2025-08-05 17:24:36'),
(112, 4, 109, 1, '2025-08-05 17:24:40'),
(113, 4, 110, 1, '2025-08-05 17:24:43'),
(114, 9, 109, 5, '2025-08-05 17:24:44'),
(115, 9, 110, 5, '2025-08-05 17:24:46'),
(116, 4, 95, 2, '2025-08-05 17:24:50'),
(117, 4, 96, 2, '2025-08-05 17:24:52'),
(118, 9, 95, 5, '2025-08-05 17:24:54'),
(119, 9, 96, 5, '2025-08-05 17:24:56'),
(120, 4, 81, 2, '2025-08-05 17:25:01'),
(121, 4, 82, 1, '2025-08-05 17:25:03'),
(122, 9, 81, 5, '2025-08-05 17:25:05'),
(123, 9, 82, 5, '2025-08-05 17:25:06'),
(124, 4, 87, 1, '2025-08-05 17:25:10'),
(125, 4, 88, 2, '2025-08-05 17:25:12'),
(126, 9, 87, 5, '2025-08-05 17:25:13'),
(127, 9, 88, 5, '2025-08-05 17:25:15'),
(128, 4, 101, 2, '2025-08-05 17:25:20'),
(129, 4, 102, 2, '2025-08-05 17:25:22'),
(130, 9, 101, 4, '2025-08-05 17:25:24'),
(131, 9, 102, 5, '2025-08-05 17:25:26'),
(132, 4, 115, 2, '2025-08-05 17:25:30'),
(133, 4, 116, 2, '2025-08-05 17:25:32'),
(134, 9, 115, 5, '2025-08-05 17:25:35'),
(135, 9, 116, 4, '2025-08-05 17:25:37'),
(136, 4, 129, 1, '2025-08-05 17:26:45'),
(137, 9, 129, 2, '2025-08-05 17:26:47'),
(138, 4, 130, 5, '2025-08-05 17:26:49'),
(139, 9, 130, 5, '2025-08-05 17:26:51'),
(140, 4, 77, 1, '2025-08-05 17:27:02'),
(141, 4, 78, 1, '2025-08-05 17:27:05'),
(142, 9, 77, 5, '2025-08-05 17:27:06'),
(143, 9, 78, 5, '2025-08-05 17:27:08'),
(144, 4, 91, 1, '2025-08-05 17:27:12'),
(145, 4, 92, 1, '2025-08-05 17:27:14'),
(146, 9, 91, 4, '2025-08-05 17:27:15'),
(147, 9, 92, 5, '2025-08-05 17:27:17'),
(148, 4, 105, 2, '2025-08-05 17:27:21'),
(149, 4, 106, 2, '2025-08-05 17:27:23'),
(150, 9, 105, 5, '2025-08-05 17:27:25'),
(151, 9, 106, 4, '2025-08-05 17:27:27'),
(152, 4, 119, 2, '2025-08-05 17:27:31'),
(153, 4, 120, 1, '2025-08-05 17:27:33'),
(154, 9, 119, 5, '2025-08-05 17:27:35'),
(155, 9, 120, 5, '2025-08-05 17:27:37'),
(156, 4, 127, 1, '2025-08-05 17:27:43'),
(157, 4, 128, 3, '2025-08-05 17:27:45'),
(158, 9, 127, 5, '2025-08-05 17:27:47'),
(159, 9, 128, 4, '2025-08-05 17:27:49'),
(160, 9, 113, 5, '2025-08-05 17:27:53'),
(161, 9, 114, 4, '2025-08-05 17:27:55'),
(162, 4, 113, 1, '2025-08-05 17:27:57'),
(163, 4, 114, 2, '2025-08-05 17:27:59'),
(164, 4, 99, 1, '2025-08-05 17:28:03'),
(165, 4, 100, 1, '2025-08-05 17:28:06'),
(166, 9, 99, 5, '2025-08-05 17:28:08'),
(167, 9, 100, 4, '2025-08-05 17:28:11'),
(168, 4, 85, 1, '2025-08-05 17:32:16'),
(169, 4, 86, 2, '2025-08-05 17:32:17'),
(170, 9, 85, 5, '2025-08-05 17:32:19'),
(171, 9, 86, 4, '2025-08-05 17:32:22');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tracking_discoverer`
--

CREATE TABLE `tbl_tracking_discoverer` (
  `tracking_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `visual_feedback_id` int(11) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_tracking_discoverer`
--

INSERT INTO `tbl_tracking_discoverer` (`tracking_id`, `student_id`, `activity_id`, `visual_feedback_id`, `recorded_at`) VALUES
(1, 1, 133, 5, '2025-08-05 16:00:00'),
(2, 1, 134, 5, '2025-08-06 16:00:00'),
(3, 1, 135, 5, '2025-08-07 16:00:00'),
(4, 1, 136, 5, '2025-08-08 16:00:00'),
(5, 1, 137, 5, '2025-08-11 16:00:00'),
(6, 1, 138, 5, '2025-08-12 16:00:00'),
(7, 1, 139, 1, '2025-08-13 16:00:00'),
(8, 1, 140, 2, '2025-08-14 16:00:00'),
(9, 1, 141, 5, '2025-08-15 16:00:00'),
(10, 1, 142, 5, '2025-08-16 16:00:00'),
(11, 1, 143, 5, '2025-08-17 16:00:00'),
(12, 1, 144, 4, '2025-08-18 16:00:00'),
(13, 1, 145, 2, '2025-10-07 16:00:00'),
(14, 1, 146, 5, '2025-10-08 16:00:00'),
(15, 1, 147, 5, '2025-10-09 16:00:00'),
(16, 1, 148, 5, '2025-10-10 16:00:00'),
(17, 1, 149, 3, '2025-10-13 16:00:00'),
(18, 1, 150, 5, '2025-10-14 16:00:00'),
(19, 1, 151, 3, '2025-10-15 16:00:00'),
(20, 1, 152, 5, '2025-10-16 16:00:00'),
(21, 1, 153, 2, '2025-10-17 16:00:00'),
(22, 1, 154, 2, '2025-10-18 16:00:00'),
(23, 1, 155, 5, '2025-10-19 16:00:00'),
(24, 1, 156, 5, '2025-10-20 16:00:00'),
(25, 1, 157, 5, '2025-12-09 16:00:00'),
(26, 1, 158, 5, '2025-12-10 16:00:00'),
(27, 1, 159, 5, '2025-12-11 16:00:00'),
(28, 1, 160, 2, '2025-12-12 16:00:00'),
(29, 1, 161, 4, '2025-12-15 16:00:00'),
(30, 1, 162, 5, '2025-12-16 16:00:00'),
(31, 1, 163, 5, '2025-12-17 16:00:00'),
(32, 1, 164, 5, '2025-12-18 16:00:00'),
(33, 1, 165, 4, '2025-12-19 16:00:00'),
(34, 1, 166, 4, '2025-12-20 16:00:00'),
(35, 1, 167, 3, '2025-12-21 16:00:00'),
(36, 1, 168, 5, '2025-12-22 16:00:00'),
(37, 1, 169, 4, '2026-02-10 16:00:00'),
(38, 1, 170, 5, '2026-02-11 16:00:00'),
(39, 1, 171, 5, '2026-02-12 16:00:00'),
(40, 1, 172, 5, '2026-02-13 16:00:00'),
(41, 1, 173, 4, '2026-02-16 16:00:00'),
(42, 1, 174, 5, '2026-02-17 16:00:00'),
(43, 1, 175, 4, '2026-02-18 16:00:00'),
(44, 1, 176, 4, '2026-02-19 16:00:00'),
(45, 1, 177, 5, '2026-02-20 16:00:00'),
(46, 1, 178, 5, '2026-02-21 16:00:00'),
(47, 1, 179, 3, '2026-02-22 16:00:00'),
(48, 1, 180, 3, '2026-02-23 16:00:00'),
(49, 15, 135, 1, '2025-08-30 17:58:43'),
(50, 15, 136, 2, '2025-08-30 17:58:44'),
(51, 16, 135, 1, '2025-08-30 17:58:45'),
(52, 16, 136, 2, '2025-08-30 17:58:47'),
(53, 14, 135, 3, '2025-08-30 17:58:48'),
(54, 14, 136, 4, '2025-08-30 17:58:50'),
(55, 17, 135, 3, '2025-08-30 17:58:51'),
(56, 17, 136, 3, '2025-08-30 17:58:53'),
(57, 2, 135, 1, '2025-08-30 17:58:59'),
(58, 2, 136, 1, '2025-08-30 17:59:00'),
(59, 15, 143, 1, '2025-08-30 17:59:09'),
(60, 15, 144, 2, '2025-08-30 17:59:11'),
(61, 16, 143, 4, '2025-08-30 17:59:13'),
(62, 16, 144, 2, '2025-08-30 17:59:14'),
(63, 14, 143, 3, '2025-08-30 17:59:16'),
(64, 14, 144, 3, '2025-08-30 17:59:17'),
(65, 17, 143, 4, '2025-08-30 17:59:19'),
(66, 17, 144, 3, '2025-08-30 17:59:20'),
(67, 2, 143, 1, '2025-08-30 17:59:21'),
(68, 2, 144, 2, '2025-08-30 17:59:23'),
(69, 15, 137, 1, '2025-08-30 17:59:29'),
(70, 15, 138, 2, '2025-08-30 17:59:31'),
(71, 16, 137, 3, '2025-08-30 17:59:32'),
(72, 16, 138, 4, '2025-08-30 17:59:33'),
(73, 14, 137, 2, '2025-08-30 17:59:35'),
(74, 14, 138, 2, '2025-08-30 17:59:36'),
(75, 17, 137, 4, '2025-08-30 17:59:38'),
(76, 17, 138, 4, '2025-08-30 17:59:40'),
(77, 2, 137, 1, '2025-08-30 17:59:44'),
(78, 2, 138, 3, '2025-08-30 17:59:47'),
(79, 15, 141, 1, '2025-08-30 17:59:54'),
(80, 15, 142, 1, '2025-08-30 17:59:55'),
(81, 16, 141, 3, '2025-08-30 17:59:59'),
(82, 16, 142, 3, '2025-08-30 18:00:00'),
(83, 14, 141, 4, '2025-08-30 18:00:04'),
(84, 14, 142, 3, '2025-08-30 18:00:05'),
(85, 17, 141, 2, '2025-08-30 18:00:07'),
(86, 17, 142, 2, '2025-08-30 18:00:09'),
(87, 2, 141, 3, '2025-08-30 18:00:13'),
(88, 2, 142, 2, '2025-08-30 18:00:14'),
(89, 15, 133, 1, '2025-08-30 18:00:18'),
(90, 15, 134, 3, '2025-08-30 18:00:20'),
(91, 16, 133, 2, '2025-08-30 18:00:21'),
(92, 16, 134, 2, '2025-08-30 18:00:23'),
(93, 14, 133, 1, '2025-08-30 18:00:25'),
(94, 14, 134, 2, '2025-08-30 18:00:27'),
(95, 17, 133, 4, '2025-08-30 18:00:28'),
(96, 17, 134, 3, '2025-08-30 18:00:30'),
(97, 2, 133, 4, '2025-08-30 18:00:36'),
(98, 2, 134, 2, '2025-08-30 18:00:37'),
(99, 15, 139, 1, '2025-08-30 18:00:41'),
(100, 15, 140, 2, '2025-08-30 18:00:43'),
(101, 16, 140, 1, '2025-08-30 18:00:45'),
(102, 16, 139, 2, '2025-08-30 18:00:47'),
(103, 14, 139, 3, '2025-08-30 18:00:48'),
(104, 14, 140, 3, '2025-08-30 18:00:50'),
(105, 17, 139, 3, '2025-08-30 18:00:52'),
(106, 17, 140, 2, '2025-08-30 18:00:53'),
(107, 2, 139, 1, '2025-08-30 18:00:58'),
(108, 2, 140, 2, '2025-08-30 18:01:00'),
(109, 15, 151, 1, '2025-08-30 18:01:06'),
(110, 15, 152, 2, '2025-08-30 18:01:07'),
(111, 16, 151, 1, '2025-08-30 18:01:09'),
(112, 16, 152, 2, '2025-08-30 18:01:10'),
(113, 14, 151, 1, '2025-08-30 18:01:12'),
(114, 14, 152, 2, '2025-08-30 18:01:13'),
(115, 17, 151, 1, '2025-08-30 18:01:14'),
(116, 17, 152, 2, '2025-08-30 18:01:16'),
(117, 2, 151, 3, '2025-08-30 18:01:23'),
(118, 2, 152, 5, '2025-08-30 18:01:25'),
(119, 15, 145, 1, '2025-08-30 18:01:30'),
(120, 15, 146, 2, '2025-08-30 18:01:32'),
(121, 16, 145, 2, '2025-08-30 18:01:33'),
(122, 16, 146, 1, '2025-08-30 18:01:35'),
(123, 14, 145, 1, '2025-08-30 18:01:37'),
(124, 14, 146, 2, '2025-08-30 18:01:38'),
(125, 17, 145, 1, '2025-08-30 18:01:39'),
(126, 17, 146, 1, '2025-08-30 18:01:41'),
(127, 2, 145, 5, '2025-08-30 18:01:46'),
(128, 2, 146, 2, '2025-08-30 18:01:48'),
(129, 15, 153, 1, '2025-08-30 18:01:54'),
(130, 15, 154, 3, '2025-08-30 18:01:56'),
(131, 16, 153, 2, '2025-08-30 18:01:57'),
(132, 16, 154, 3, '2025-08-30 18:01:59'),
(133, 14, 153, 4, '2025-08-30 18:02:00'),
(134, 14, 154, 2, '2025-08-30 18:02:02'),
(135, 17, 153, 2, '2025-08-30 18:02:03'),
(136, 17, 154, 2, '2025-08-30 18:02:05'),
(137, 2, 153, 1, '2025-08-30 18:02:10'),
(138, 2, 154, 2, '2025-08-30 18:02:11'),
(139, 15, 149, 1, '2025-08-30 18:02:14'),
(140, 15, 150, 2, '2025-08-30 18:02:16'),
(141, 16, 149, 1, '2025-08-30 18:02:17'),
(142, 16, 150, 2, '2025-08-30 18:02:19'),
(143, 14, 149, 2, '2025-08-30 18:02:21'),
(144, 14, 150, 2, '2025-08-30 18:02:22'),
(145, 17, 149, 1, '2025-08-30 18:02:24'),
(146, 17, 150, 2, '2025-08-30 18:02:25'),
(147, 2, 149, 5, '2025-08-30 18:02:34'),
(148, 2, 150, 2, '2025-08-30 18:02:35'),
(149, 15, 155, 1, '2025-08-30 18:02:39'),
(150, 15, 156, 2, '2025-08-30 18:02:40'),
(151, 16, 155, 2, '2025-08-30 18:02:42'),
(152, 16, 156, 2, '2025-08-30 18:02:43'),
(153, 14, 155, 3, '2025-08-30 18:02:45'),
(154, 14, 156, 3, '2025-08-30 18:02:46'),
(155, 17, 155, 4, '2025-08-30 18:02:47'),
(156, 17, 156, 4, '2025-08-30 18:02:49'),
(157, 2, 155, 2, '2025-08-30 18:02:54'),
(158, 2, 156, 1, '2025-08-30 18:02:55'),
(159, 15, 147, 2, '2025-08-30 18:02:59'),
(160, 15, 148, 2, '2025-08-30 18:03:01'),
(161, 16, 147, 4, '2025-08-30 18:03:02'),
(162, 16, 148, 4, '2025-08-30 18:03:04'),
(163, 14, 147, 2, '2025-08-30 18:03:06'),
(164, 14, 148, 3, '2025-08-30 18:03:07'),
(165, 17, 147, 1, '2025-08-30 18:03:08'),
(166, 17, 148, 2, '2025-08-30 18:03:13'),
(167, 2, 147, 1, '2025-08-30 18:03:14'),
(168, 2, 148, 2, '2025-08-30 18:03:16'),
(169, 15, 159, 1, '2025-08-30 18:03:26'),
(170, 15, 160, 2, '2025-08-30 18:03:28'),
(171, 16, 159, 1, '2025-08-30 18:03:30'),
(172, 16, 160, 2, '2025-08-30 18:03:31'),
(173, 14, 159, 4, '2025-08-30 18:03:34'),
(174, 14, 160, 2, '2025-08-30 18:03:35'),
(175, 17, 159, 1, '2025-08-30 18:03:37'),
(176, 17, 160, 1, '2025-08-30 18:03:39'),
(177, 2, 159, 1, '2025-08-30 18:03:44'),
(178, 2, 160, 1, '2025-08-30 18:03:45'),
(179, 15, 167, 1, '2025-08-30 18:03:51'),
(180, 15, 168, 2, '2025-08-30 18:03:53'),
(181, 16, 167, 1, '2025-08-30 18:03:54'),
(182, 16, 168, 2, '2025-08-30 18:03:56'),
(183, 14, 167, 2, '2025-08-30 18:03:57'),
(184, 14, 168, 2, '2025-08-30 18:03:59'),
(185, 17, 167, 3, '2025-08-30 18:04:00'),
(186, 17, 168, 3, '2025-08-30 18:04:02'),
(187, 2, 167, 2, '2025-08-30 18:04:06'),
(188, 2, 168, 2, '2025-08-30 18:04:07'),
(189, 15, 161, 2, '2025-08-30 18:10:41'),
(190, 15, 162, 1, '2025-08-30 18:10:42'),
(191, 16, 161, 4, '2025-08-30 18:10:44'),
(192, 16, 162, 2, '2025-08-30 18:10:45'),
(193, 14, 161, 1, '2025-08-30 18:10:46'),
(194, 14, 162, 2, '2025-08-30 18:10:48'),
(195, 17, 161, 4, '2025-08-30 18:10:50'),
(196, 17, 162, 3, '2025-08-30 18:10:51'),
(197, 2, 161, 4, '2025-08-30 18:10:56'),
(198, 2, 162, 2, '2025-08-30 18:10:57'),
(199, 15, 165, 1, '2025-08-30 18:11:00'),
(200, 15, 166, 2, '2025-08-30 18:11:02'),
(201, 16, 165, 1, '2025-08-30 18:11:03'),
(202, 16, 166, 1, '2025-08-30 18:11:04'),
(203, 14, 165, 2, '2025-08-30 18:11:06'),
(204, 14, 166, 2, '2025-08-30 18:11:08'),
(205, 17, 165, 1, '2025-08-30 18:11:09'),
(206, 17, 166, 2, '2025-08-30 18:11:11'),
(207, 2, 165, 3, '2025-08-30 18:11:22'),
(208, 2, 166, 2, '2025-08-30 18:11:23'),
(209, 15, 157, 1, '2025-08-30 18:11:26'),
(210, 15, 158, 2, '2025-08-30 18:11:28'),
(211, 16, 157, 1, '2025-08-30 18:11:29'),
(212, 16, 158, 2, '2025-08-30 18:11:30'),
(213, 14, 157, 3, '2025-08-30 18:11:33'),
(214, 14, 158, 3, '2025-08-30 18:11:35'),
(215, 17, 157, 4, '2025-08-30 18:11:36'),
(216, 17, 158, 2, '2025-08-30 18:11:38'),
(217, 2, 157, 1, '2025-08-30 18:11:43'),
(218, 2, 158, 2, '2025-08-30 18:11:44'),
(219, 15, 163, 1, '2025-08-30 18:11:47'),
(220, 15, 164, 3, '2025-08-30 18:11:49'),
(221, 16, 163, 2, '2025-08-30 18:11:50'),
(222, 16, 164, 2, '2025-08-30 18:11:52'),
(223, 14, 163, 4, '2025-08-30 18:11:54'),
(224, 14, 164, 2, '2025-08-30 18:11:55'),
(225, 17, 163, 2, '2025-08-30 18:11:57'),
(226, 17, 164, 3, '2025-08-30 18:11:58'),
(227, 2, 163, 1, '2025-08-30 18:12:05'),
(228, 2, 164, 2, '2025-08-30 18:12:08'),
(229, 15, 175, 2, '2025-08-30 18:12:14'),
(230, 15, 176, 2, '2025-08-30 18:12:15'),
(231, 16, 175, 3, '2025-08-30 18:12:19'),
(232, 16, 176, 1, '2025-08-30 18:12:20'),
(233, 14, 175, 4, '2025-08-30 18:12:22'),
(234, 14, 176, 2, '2025-08-30 18:12:24'),
(235, 17, 175, 2, '2025-08-30 18:12:26'),
(236, 17, 176, 4, '2025-08-30 18:12:27'),
(237, 2, 175, 5, '2025-08-30 18:12:32'),
(238, 2, 176, 5, '2025-08-30 18:12:33'),
(239, 15, 169, 2, '2025-08-30 18:12:37'),
(240, 15, 170, 3, '2025-08-30 18:12:40'),
(241, 16, 169, 2, '2025-08-30 18:12:41'),
(242, 16, 170, 2, '2025-08-30 18:12:44'),
(243, 14, 169, 3, '2025-08-30 18:12:45'),
(244, 14, 170, 3, '2025-08-30 18:12:47'),
(245, 17, 169, 1, '2025-08-30 18:12:48'),
(246, 17, 170, 2, '2025-08-30 18:12:50'),
(247, 2, 169, 5, '2025-08-30 18:12:56'),
(248, 2, 170, 2, '2025-08-30 18:12:59'),
(249, 15, 177, 2, '2025-08-30 18:13:36'),
(250, 15, 178, 2, '2025-08-30 18:13:37'),
(251, 16, 177, 1, '2025-08-30 18:13:39'),
(252, 16, 178, 2, '2025-08-30 18:13:41'),
(253, 14, 177, 4, '2025-08-30 18:13:44'),
(254, 14, 178, 4, '2025-08-30 18:13:45'),
(255, 17, 177, 4, '2025-08-30 18:13:46'),
(256, 17, 178, 4, '2025-08-30 18:13:48'),
(257, 2, 177, 2, '2025-08-30 18:13:53'),
(258, 2, 178, 2, '2025-08-30 18:13:54'),
(259, 15, 173, 1, '2025-08-30 18:13:58'),
(260, 15, 174, 1, '2025-08-30 18:13:59'),
(261, 16, 173, 1, '2025-08-30 18:14:00'),
(262, 16, 174, 1, '2025-08-30 18:14:02'),
(263, 2, 173, 1, '2025-08-30 18:14:03'),
(264, 2, 174, 1, '2025-08-30 18:14:05'),
(265, 14, 173, 2, '2025-08-30 18:14:06'),
(266, 14, 174, 2, '2025-08-30 18:14:07'),
(267, 17, 173, 3, '2025-08-30 18:14:08'),
(268, 17, 174, 3, '2025-08-30 18:14:10'),
(269, 15, 179, 1, '2025-08-30 18:14:17'),
(270, 15, 180, 3, '2025-08-30 18:14:18'),
(271, 16, 179, 3, '2025-08-30 18:14:20'),
(272, 16, 180, 3, '2025-08-30 18:14:21'),
(273, 14, 179, 2, '2025-08-30 18:14:22'),
(274, 14, 180, 2, '2025-08-30 18:14:24'),
(275, 17, 179, 4, '2025-08-30 18:14:25'),
(276, 17, 180, 3, '2025-08-30 18:14:27'),
(277, 2, 179, 5, '2025-08-30 18:14:34'),
(278, 2, 180, 1, '2025-08-30 18:14:36'),
(279, 15, 171, 1, '2025-08-30 18:14:39'),
(280, 15, 172, 2, '2025-08-30 18:14:40'),
(281, 16, 171, 2, '2025-08-30 18:14:41'),
(282, 16, 172, 2, '2025-08-30 18:14:43'),
(283, 14, 171, 3, '2025-08-30 18:14:44'),
(284, 14, 172, 3, '2025-08-30 18:14:46'),
(285, 17, 171, 4, '2025-08-30 18:14:48'),
(286, 17, 172, 4, '2025-08-30 18:14:49'),
(287, 2, 171, 5, '2025-08-30 18:14:53'),
(288, 2, 172, 3, '2025-08-30 18:14:56');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tracking_explorer`
--

CREATE TABLE `tbl_tracking_explorer` (
  `tracking_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `visual_feedback_id` int(11) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_tracking_explorer`
--

INSERT INTO `tbl_tracking_explorer` (`tracking_id`, `student_id`, `activity_id`, `visual_feedback_id`, `recorded_at`) VALUES
(1, 3, 1, 3, '2025-07-14 12:31:23'),
(2, 6, 1, 1, '2025-07-14 12:31:23'),
(3, 8, 1, 3, '2025-07-14 12:31:23'),
(4, 3, 2, 1, '2025-07-14 12:33:12'),
(5, 6, 2, 1, '2025-07-14 12:33:12'),
(6, 8, 2, 1, '2025-07-14 12:33:12'),
(7, 3, 3, 1, '2025-07-14 12:33:54'),
(8, 6, 3, 1, '2025-07-14 12:33:54'),
(9, 8, 3, 2, '2025-07-14 12:33:54'),
(10, 6, 4, 3, '2025-07-15 07:52:56'),
(11, 8, 4, 1, '2025-07-15 07:52:56'),
(12, 3, 4, 2, '2025-07-17 13:28:21'),
(13, 6, 5, 1, '2025-07-17 13:33:20'),
(14, 8, 5, 4, '2025-07-17 13:33:20'),
(15, 11, 5, 1, '2025-07-17 13:33:20'),
(16, 3, 5, 1, '2025-07-17 13:42:41'),
(17, 11, 4, 4, '2025-07-17 13:49:34'),
(18, 11, 2, 5, '2025-07-17 13:49:36'),
(19, 11, 1, 5, '2025-07-17 13:49:39'),
(20, 7, 5, 5, '2025-07-17 13:57:03'),
(21, 7, 4, 5, '2025-07-17 13:57:26'),
(22, 7, 2, 4, '2025-07-17 13:57:29'),
(23, 7, 1, 5, '2025-07-17 13:57:33'),
(24, 12, 5, 5, '2025-07-17 14:01:52'),
(25, 12, 4, 4, '2025-07-17 14:01:54'),
(26, 12, 2, 5, '2025-07-17 14:01:56'),
(27, 12, 1, 5, '2025-07-17 14:01:59'),
(28, 7, 3, 3, '2025-07-17 14:02:26'),
(29, 12, 3, 5, '2025-07-17 14:02:28'),
(30, 6, 6, 1, '2025-07-17 15:30:16'),
(31, 8, 6, 1, '2025-07-17 15:30:16'),
(32, 11, 6, 5, '2025-07-17 15:30:16'),
(33, 6, 7, 5, '2025-07-17 15:34:53'),
(34, 8, 7, 5, '2025-07-17 15:34:53'),
(35, 11, 7, 5, '2025-07-17 15:34:53'),
(36, 6, 8, 1, '2025-07-17 15:45:05'),
(37, 8, 8, 5, '2025-07-17 15:45:05'),
(38, 11, 8, 4, '2025-07-17 15:45:05'),
(39, 6, 9, 1, '2025-07-17 15:56:56'),
(40, 8, 9, 2, '2025-07-17 15:56:56'),
(41, 11, 9, 4, '2025-07-17 15:56:56'),
(42, 6, 10, 1, '2025-07-20 08:30:19'),
(43, 8, 10, 4, '2025-07-20 08:30:19'),
(44, 11, 10, 5, '2025-07-20 08:30:19'),
(45, 6, 11, 1, '2025-07-20 08:40:23'),
(46, 8, 11, 5, '2025-07-20 08:40:23'),
(47, 11, 11, 5, '2025-07-20 08:40:23'),
(48, 8, 6, 1, '2025-07-20 09:11:34'),
(49, 8, 11, 5, '2025-07-20 09:18:53'),
(50, 11, 3, 5, '2025-07-20 09:27:19'),
(51, 6, 12, 2, '2025-07-20 10:55:54'),
(52, 8, 12, 5, '2025-07-20 10:55:54'),
(53, 11, 12, 5, '2025-07-20 10:55:54'),
(54, 6, 13, 1, '2025-07-20 10:56:05'),
(55, 8, 13, 5, '2025-07-20 10:56:05'),
(56, 11, 13, 5, '2025-07-20 10:56:05'),
(57, 6, 14, 1, '2025-07-20 10:56:20'),
(58, 8, 14, 5, '2025-07-20 10:56:20'),
(59, 11, 14, 5, '2025-07-20 10:56:20'),
(60, 3, 1, NULL, '2025-09-30 02:12:00'),
(61, 11, 1, NULL, '2025-09-30 08:55:00'),
(62, 8, 1, NULL, '2025-09-30 00:21:00'),
(63, 3, 2, NULL, '2025-09-04 00:03:00'),
(64, 11, 2, NULL, '2025-09-04 06:05:00'),
(65, 8, 2, NULL, '2025-09-04 01:47:00'),
(66, 3, 3, NULL, '2025-09-14 07:48:00'),
(67, 11, 3, NULL, '2025-09-14 08:14:00'),
(68, 8, 3, NULL, '2025-09-14 06:02:00'),
(69, 3, 4, NULL, '2025-08-13 06:41:00'),
(70, 11, 4, NULL, '2025-08-13 03:50:00'),
(71, 8, 4, NULL, '2025-08-13 03:02:00'),
(72, 3, 5, NULL, '2025-08-26 02:04:00'),
(73, 11, 5, 1, '2025-08-26 00:08:00'),
(74, 8, 5, NULL, '2025-08-26 03:54:00'),
(75, 3, 6, 1, '2025-09-22 00:56:00'),
(76, 11, 6, 5, '2025-09-22 05:33:00'),
(77, 8, 6, NULL, '2025-09-22 00:19:00'),
(78, 3, 7, 4, '2025-09-17 01:49:00'),
(79, 11, 7, NULL, '2025-09-17 06:50:00'),
(80, 8, 7, NULL, '2025-09-17 05:56:00'),
(81, 3, 8, 2, '2025-08-23 01:37:00'),
(82, 11, 8, NULL, '2025-08-23 01:17:00'),
(83, 8, 8, NULL, '2025-08-23 02:26:00'),
(84, 3, 9, 1, '2025-09-05 08:57:00'),
(85, 11, 9, NULL, '2025-09-05 01:21:00'),
(86, 8, 9, NULL, '2025-09-05 06:09:00'),
(87, 3, 10, 1, '2025-08-11 04:16:00'),
(88, 11, 10, 5, '2025-08-11 02:38:00'),
(89, 8, 10, 4, '2025-08-11 00:17:00'),
(90, 3, 11, 2, '2025-09-14 07:46:00'),
(91, 11, 11, NULL, '2025-09-14 06:03:00'),
(92, 8, 11, NULL, '2025-09-14 07:32:00'),
(93, 3, 12, 3, '2025-09-20 00:19:00'),
(94, 11, 12, 5, '2025-09-20 08:28:00'),
(95, 8, 12, 5, '2025-09-20 01:37:00'),
(96, 3, 13, 2, '2025-11-02 04:26:00'),
(97, 11, 13, NULL, '2025-11-02 04:28:00'),
(98, 8, 13, 5, '2025-11-02 03:55:00'),
(99, 3, 14, 1, '2025-11-04 03:04:00'),
(100, 11, 14, NULL, '2025-11-04 00:45:00'),
(101, 8, 14, 5, '2025-11-04 08:15:00'),
(102, 3, 15, 1, '2025-11-16 01:56:00'),
(103, 11, 15, 5, '2025-11-16 07:46:00'),
(104, 8, 15, 2, '2025-11-16 02:46:00'),
(105, 3, 16, 2, '2025-10-24 06:17:00'),
(106, 11, 16, 4, '2025-10-24 01:51:00'),
(107, 8, 16, 3, '2025-10-24 05:25:00'),
(108, 3, 17, 2, '2025-11-06 02:48:00'),
(109, 11, 17, 2, '2025-11-06 01:35:00'),
(110, 8, 17, 1, '2025-11-06 08:01:00'),
(111, 3, 18, 1, '2025-11-30 02:19:00'),
(112, 11, 18, 3, '2025-11-30 07:10:00'),
(113, 8, 18, 1, '2025-11-30 05:36:00'),
(114, 3, 19, 1, '2025-10-07 05:20:00'),
(115, 11, 19, 5, '2025-10-07 01:47:00'),
(116, 8, 19, 4, '2025-10-07 00:27:00'),
(117, 3, 20, 2, '2025-11-20 07:25:00'),
(118, 11, 20, 5, '2025-11-20 02:11:00'),
(119, 8, 20, 2, '2025-11-20 01:20:00'),
(120, 3, 21, 1, '2025-11-02 02:55:00'),
(121, 11, 21, 5, '2025-11-02 06:53:00'),
(122, 8, 21, 3, '2025-11-02 01:43:00'),
(123, 3, 22, 2, '2025-11-26 03:01:00'),
(124, 11, 22, 5, '2025-11-26 03:09:00'),
(125, 8, 22, 1, '2025-11-26 01:14:00'),
(126, 3, 23, 4, '2025-10-06 03:43:00'),
(127, 11, 23, 5, '2025-10-06 05:47:00'),
(128, 8, 23, 1, '2025-10-06 03:57:00'),
(129, 3, 24, 1, '2025-10-26 03:09:00'),
(130, 11, 24, 4, '2025-10-26 00:33:00'),
(131, 8, 24, 3, '2025-10-26 08:15:00'),
(132, 3, 25, 3, '2025-12-21 08:35:00'),
(133, 11, 25, 5, '2025-12-21 05:37:00'),
(134, 8, 25, 2, '2025-12-21 06:23:00'),
(135, 3, 26, 1, '2025-12-20 06:58:00'),
(136, 11, 26, 5, '2025-12-20 07:47:00'),
(137, 8, 26, 4, '2025-12-20 07:51:00'),
(138, 3, 27, NULL, '2026-01-03 08:13:00'),
(139, 11, 27, 5, '2026-01-03 04:46:00'),
(140, 8, 27, 4, '2026-01-03 04:30:00'),
(141, 3, 28, NULL, '2025-12-23 01:43:00'),
(142, 11, 28, 4, '2025-12-23 04:24:00'),
(143, 8, 28, 3, '2025-12-23 04:09:00'),
(144, 3, 29, 1, '2025-12-21 02:50:00'),
(145, 11, 29, 4, '2025-12-21 03:55:00'),
(146, 8, 29, 4, '2025-12-21 01:55:00'),
(147, 3, 30, 2, '2026-02-07 01:56:00'),
(148, 11, 30, 3, '2026-02-07 01:08:00'),
(149, 8, 30, 4, '2026-02-07 07:53:00'),
(150, 3, 31, NULL, '2025-12-12 02:04:00'),
(151, 11, 31, 5, '2025-12-12 01:31:00'),
(152, 8, 31, 4, '2025-12-12 04:38:00'),
(153, 3, 32, NULL, '2025-12-16 02:12:00'),
(154, 11, 32, 5, '2025-12-16 01:46:00'),
(155, 8, 32, 5, '2025-12-16 07:45:00'),
(156, 3, 33, NULL, '2026-02-06 04:05:00'),
(157, 11, 33, 5, '2026-02-06 01:57:00'),
(158, 8, 33, 4, '2026-02-06 03:25:00'),
(159, 3, 34, NULL, '2026-01-30 03:24:00'),
(160, 11, 34, 5, '2026-01-30 05:56:00'),
(161, 8, 34, 5, '2026-01-30 00:36:00'),
(162, 3, 35, NULL, '2025-12-28 08:14:00'),
(163, 11, 35, 4, '2025-12-28 08:30:00'),
(164, 8, 35, 3, '2025-12-28 02:44:00'),
(165, 3, 36, NULL, '2025-12-10 04:59:00'),
(166, 11, 36, 5, '2025-12-10 06:29:00'),
(167, 8, 36, 4, '2025-12-10 04:57:00'),
(168, 3, 37, 5, '2026-03-05 08:56:00'),
(169, 11, 37, 5, '2026-03-05 07:18:00'),
(170, 8, 37, 3, '2026-03-05 00:13:00'),
(171, 3, 38, 5, '2026-03-02 08:37:00'),
(172, 11, 38, 5, '2026-03-02 02:27:00'),
(173, 8, 38, 3, '2026-03-02 06:17:00'),
(174, 3, 39, NULL, '2026-03-25 02:02:00'),
(175, 11, 39, 5, '2026-03-25 00:01:00'),
(176, 8, 39, 2, '2026-03-25 07:22:00'),
(177, 3, 40, NULL, '2026-02-28 00:48:00'),
(178, 11, 40, 5, '2026-02-28 05:31:00'),
(179, 8, 40, 3, '2026-02-28 03:29:00'),
(180, 3, 41, NULL, '2026-04-01 00:49:00'),
(181, 11, 41, 5, '2026-04-01 05:44:00'),
(182, 8, 41, 1, '2026-04-01 00:56:00'),
(183, 3, 42, NULL, '2026-02-10 07:22:00'),
(184, 11, 42, 4, '2026-02-10 04:30:00'),
(185, 8, 42, 3, '2026-02-10 04:02:00'),
(186, 3, 43, NULL, '2026-04-07 06:55:00'),
(187, 11, 43, 5, '2026-04-07 05:56:00'),
(188, 8, 43, 3, '2026-04-07 04:55:00'),
(189, 3, 44, NULL, '2026-03-22 03:02:00'),
(190, 11, 44, 5, '2026-03-22 02:57:00'),
(191, 8, 44, 1, '2026-03-22 06:26:00'),
(192, 3, 45, NULL, '2026-03-16 02:54:00'),
(193, 11, 45, 4, '2026-03-16 00:03:00'),
(194, 8, 45, 2, '2026-03-16 03:40:00'),
(195, 3, 46, NULL, '2026-02-27 05:18:00'),
(196, 11, 46, 5, '2026-02-27 04:14:00'),
(197, 8, 46, 1, '2026-02-27 08:27:00'),
(198, 3, 47, NULL, '2026-02-26 03:29:00'),
(199, 11, 47, 5, '2026-02-26 02:48:00'),
(200, 8, 47, 4, '2026-02-26 01:33:00'),
(201, 3, 48, NULL, '2026-03-06 02:08:00'),
(202, 11, 48, 5, '2026-03-06 05:46:00'),
(203, 8, 48, 5, '2026-03-06 07:30:00'),
(204, 6, 63, 1, '2025-07-21 08:54:45'),
(205, 8, 63, 3, '2025-07-21 08:54:45'),
(206, 11, 63, 4, '2025-07-21 08:54:45'),
(207, 6, 64, 2, '2025-07-21 08:59:52'),
(208, 8, 64, 4, '2025-07-21 08:59:52'),
(209, 11, 64, 5, '2025-07-21 08:59:52'),
(210, 6, 65, 1, '2025-07-21 09:00:22'),
(211, 8, 65, 2, '2025-07-21 09:00:22'),
(212, 11, 65, 2, '2025-07-21 09:00:22'),
(213, 6, 66, 1, '2025-07-21 09:04:24'),
(214, 8, 66, 3, '2025-07-21 09:04:24'),
(215, 11, 66, 4, '2025-07-21 09:04:24'),
(216, 6, 67, 1, '2025-07-21 09:04:38'),
(217, 8, 67, 4, '2025-07-21 09:04:38'),
(218, 11, 67, 4, '2025-07-21 09:04:38'),
(219, 6, 68, 2, '2025-07-21 09:04:46'),
(220, 8, 68, 2, '2025-07-21 09:04:46'),
(221, 11, 68, 5, '2025-07-21 09:04:46'),
(222, 6, 69, 1, '2025-07-21 09:06:25'),
(223, 8, 69, 3, '2025-07-21 09:06:25'),
(224, 11, 69, 4, '2025-07-21 09:06:25'),
(225, 6, 70, 2, '2025-07-21 09:06:42'),
(226, 8, 70, 4, '2025-07-21 09:06:42'),
(227, 11, 70, 4, '2025-07-21 09:06:42'),
(228, 6, 71, 1, '2025-07-21 09:06:57'),
(229, 8, 71, 2, '2025-07-21 09:06:57'),
(230, 11, 71, 5, '2025-07-21 09:06:57'),
(231, 6, 25, 2, '2025-07-21 09:11:18'),
(232, 6, 26, 1, '2025-07-21 09:11:20'),
(233, 6, 24, 2, '2025-07-21 09:13:14'),
(234, 6, 23, 1, '2025-07-21 09:13:18'),
(235, 6, 12, 2, '2025-07-21 09:24:33'),
(236, 6, 12, 2, '2025-07-21 09:54:04'),
(237, 6, 12, 2, '2025-07-21 09:54:15'),
(238, 6, 19, 1, '2025-07-21 10:04:39'),
(239, 6, 20, 2, '2025-07-21 10:04:42'),
(240, 6, 24, 2, '2025-07-21 10:05:36'),
(241, 6, 16, 3, '2025-07-21 10:06:19'),
(242, 6, 15, 3, '2025-07-21 10:06:21'),
(243, 6, 22, 2, '2025-07-21 10:07:05'),
(244, 6, 21, 3, '2025-07-21 10:07:07'),
(245, 6, 18, 1, '2025-07-21 10:07:47'),
(246, 6, 17, 2, '2025-07-21 10:08:27'),
(247, 6, 35, 1, '2025-07-21 10:13:30'),
(248, 6, 36, 2, '2025-07-21 10:13:32'),
(249, 6, 37, 1, '2025-07-21 10:13:47'),
(250, 6, 38, 2, '2025-07-21 10:13:49'),
(251, 6, 72, 1, '2025-07-21 10:14:29'),
(252, 8, 72, 2, '2025-07-21 10:14:30'),
(253, 11, 72, 5, '2025-07-21 10:14:30'),
(254, 11, 72, 5, '2025-07-21 10:15:41'),
(255, 6, 73, 1, '2025-07-21 10:16:17'),
(256, 8, 73, 3, '2025-07-21 10:16:17'),
(257, 11, 73, 3, '2025-07-21 10:16:17'),
(258, 6, 30, 3, '2025-07-21 10:16:24'),
(259, 6, 29, 1, '2025-07-21 10:16:28'),
(260, 6, 31, 2, '2025-07-21 10:16:56'),
(261, 6, 32, 3, '2025-07-21 10:16:59'),
(262, 6, 27, 2, '2025-07-21 10:17:17'),
(263, 6, 28, 2, '2025-07-21 10:17:20'),
(264, 6, 33, 2, '2025-07-21 10:17:33'),
(265, 6, 34, 2, '2025-07-21 10:17:35'),
(266, 6, 49, 1, '2025-07-21 10:19:03'),
(267, 6, 50, 1, '2025-07-21 10:19:05'),
(268, 8, 49, 2, '2025-07-21 10:19:08'),
(269, 8, 50, 3, '2025-07-21 10:19:10'),
(270, 11, 49, 5, '2025-07-21 10:19:12'),
(271, 11, 50, 4, '2025-07-21 10:19:14'),
(272, 6, 41, 1, '2025-07-21 10:19:18'),
(273, 6, 42, 2, '2025-07-21 10:19:21'),
(274, 6, 47, 2, '2025-07-21 10:19:35'),
(275, 6, 48, 2, '2025-07-21 10:19:36'),
(276, 6, 43, 1, '2025-07-21 10:19:52'),
(277, 6, 44, 3, '2025-07-21 10:19:54'),
(278, 6, 39, 1, '2025-07-21 10:20:07'),
(279, 6, 40, 2, '2025-07-21 10:20:09'),
(280, 6, 45, 2, '2025-07-21 10:20:23'),
(281, 6, 46, 1, '2025-07-21 10:20:25'),
(282, 6, 57, 1, '2025-07-21 10:20:59'),
(283, 6, 58, 2, '2025-07-21 10:21:01'),
(284, 8, 57, 4, '2025-07-21 10:21:05'),
(285, 8, 58, 3, '2025-07-21 10:21:07'),
(286, 11, 57, 5, '2025-07-21 10:21:09'),
(287, 11, 58, 5, '2025-07-21 10:21:11'),
(288, 6, 51, 1, '2025-07-21 10:21:29'),
(289, 6, 52, 2, '2025-07-21 10:21:32'),
(290, 8, 51, 4, '2025-07-21 10:21:34'),
(291, 8, 52, 3, '2025-07-21 10:21:36'),
(292, 11, 51, 5, '2025-07-21 10:21:39'),
(293, 11, 52, 5, '2025-07-21 10:21:42'),
(294, 6, 59, 1, '2025-07-21 10:21:45'),
(295, 6, 60, 2, '2025-07-21 10:21:47'),
(296, 8, 59, 3, '2025-07-21 10:21:49'),
(297, 8, 60, 4, '2025-07-21 10:21:51'),
(298, 11, 59, 2, '2025-07-21 10:21:53'),
(299, 11, 60, 4, '2025-07-21 10:21:57'),
(300, 6, 55, 1, '2025-07-21 10:22:09'),
(301, 6, 56, 2, '2025-07-21 10:22:11'),
(302, 8, 55, 4, '2025-07-21 10:22:13'),
(303, 8, 56, 3, '2025-07-21 10:22:15'),
(304, 11, 55, 5, '2025-07-21 10:22:17'),
(305, 11, 56, 4, '2025-07-21 10:22:19'),
(306, 6, 53, 2, '2025-07-21 10:22:24'),
(307, 6, 54, 1, '2025-07-21 10:22:26'),
(308, 8, 53, 4, '2025-07-21 10:22:29'),
(309, 8, 54, 3, '2025-07-21 10:22:31'),
(310, 11, 53, 5, '2025-07-21 10:22:33'),
(311, 11, 54, 5, '2025-07-21 10:22:35'),
(312, 6, 61, 1, '2025-07-21 10:22:41'),
(313, 6, 62, 2, '2025-07-21 10:22:43'),
(314, 8, 61, 4, '2025-07-21 10:22:48'),
(315, 8, 62, 3, '2025-07-21 10:22:51'),
(316, 11, 61, 4, '2025-07-21 10:22:53'),
(317, 11, 62, 5, '2025-07-21 10:22:56'),
(318, 3, 63, 2, '2025-07-21 14:31:57'),
(319, 3, 64, 2, '2025-07-21 14:31:59'),
(320, 7, 12, 1, '2025-07-21 14:32:06'),
(321, 7, 63, 2, '2025-07-21 14:32:09'),
(322, 7, 64, 1, '2025-07-21 14:32:11'),
(323, 7, 25, 2, '2025-07-21 14:32:13'),
(324, 7, 26, 1, '2025-07-21 14:32:16'),
(325, 12, 12, 5, '2025-07-21 14:32:18'),
(326, 12, 63, 4, '2025-07-21 14:32:20'),
(327, 12, 64, 5, '2025-07-21 14:32:22'),
(328, 12, 25, 5, '2025-07-21 14:32:26'),
(329, 12, 26, 5, '2025-07-21 14:32:28'),
(330, 3, 72, 1, '2025-07-21 14:33:40'),
(331, 3, 65, 2, '2025-07-21 14:33:42'),
(332, 3, 66, 2, '2025-07-21 14:33:44'),
(333, 3, 67, 3, '2025-07-21 14:33:46'),
(334, 7, 18, 5, '2025-07-21 14:33:48'),
(335, 7, 9, 4, '2025-07-21 14:33:51'),
(336, 7, 72, 5, '2025-07-21 14:33:53'),
(337, 7, 65, 4, '2025-07-21 14:33:55'),
(338, 7, 66, 5, '2025-07-21 14:33:57'),
(339, 7, 67, 4, '2025-07-21 14:33:59'),
(340, 12, 18, 5, '2025-07-21 14:34:01'),
(341, 12, 9, 4, '2025-07-21 14:34:03'),
(342, 12, 72, 5, '2025-07-21 14:34:05'),
(343, 12, 65, 5, '2025-07-21 14:34:07'),
(344, 12, 66, 5, '2025-07-21 14:34:09'),
(345, 12, 67, 5, '2025-07-21 14:34:11'),
(346, 3, 68, 2, '2025-07-21 14:34:15'),
(347, 7, 68, 4, '2025-07-21 14:34:20'),
(348, 7, 17, 1, '2025-07-21 14:34:22'),
(349, 12, 68, 5, '2025-07-21 14:34:24'),
(350, 12, 17, 5, '2025-07-21 14:34:27'),
(351, 7, 19, 4, '2025-07-21 14:52:11'),
(352, 12, 19, 5, '2025-07-21 14:52:13'),
(353, 6, 74, 1, '2025-07-21 14:56:00'),
(354, 8, 74, 2, '2025-07-21 14:56:00'),
(355, 11, 74, 1, '2025-07-21 14:56:00'),
(356, 7, 6, 2, '2025-07-21 14:56:58'),
(357, 12, 6, 5, '2025-07-21 14:57:00'),
(358, 7, 7, 2, '2025-07-21 14:57:04'),
(359, 12, 7, 5, '2025-07-21 14:57:06'),
(360, 7, 11, 3, '2025-07-21 14:57:10'),
(361, 12, 11, 5, '2025-07-21 14:57:12'),
(362, 7, 8, 2, '2025-07-21 14:57:16'),
(363, 12, 8, 5, '2025-07-21 14:57:18'),
(364, 3, 74, 1, '2025-07-21 14:57:20'),
(365, 7, 74, 1, '2025-07-21 14:57:23'),
(366, 12, 74, 5, '2025-07-21 14:57:25'),
(367, 7, 20, 3, '2025-07-21 14:57:30'),
(368, 12, 20, 5, '2025-07-21 14:57:32'),
(369, 7, 24, 2, '2025-07-21 14:58:04'),
(370, 12, 24, 5, '2025-07-21 14:58:06'),
(371, 3, 71, 3, '2025-07-21 14:58:10'),
(372, 7, 13, 3, '2025-07-21 14:58:15'),
(373, 7, 71, 4, '2025-07-21 14:58:16'),
(374, 7, 23, 5, '2025-07-21 14:58:19'),
(375, 12, 13, 5, '2025-07-21 14:58:21'),
(376, 12, 71, 5, '2025-07-21 14:58:24'),
(377, 12, 23, 5, '2025-07-21 14:58:26'),
(378, 7, 14, 1, '2025-07-21 14:58:34'),
(379, 12, 14, 5, '2025-07-21 14:58:36'),
(380, 3, 69, 2, '2025-07-21 14:58:38'),
(381, 7, 69, 2, '2025-07-21 14:58:40'),
(382, 12, 69, 4, '2025-07-21 14:58:42'),
(383, 7, 16, 2, '2025-07-21 14:58:47'),
(384, 12, 16, 5, '2025-07-21 14:58:49'),
(385, 7, 15, 2, '2025-07-21 14:58:51'),
(386, 12, 15, 5, '2025-07-21 14:58:53'),
(387, 3, 70, 1, '2025-07-21 14:58:58'),
(388, 7, 70, 2, '2025-07-21 14:58:59'),
(389, 12, 70, 5, '2025-07-21 14:59:01'),
(390, 7, 22, 1, '2025-07-21 14:59:06'),
(391, 12, 22, 5, '2025-07-21 14:59:11'),
(392, 7, 21, 2, '2025-07-21 14:59:15'),
(393, 12, 21, 5, '2025-07-21 14:59:17'),
(394, 12, 37, 5, '2025-07-26 16:33:26'),
(395, 12, 38, 5, '2025-07-26 16:33:28'),
(396, 7, 37, 2, '2025-07-26 16:33:35'),
(397, 7, 38, 1, '2025-07-26 16:33:37'),
(398, 6, 75, 2, '2025-07-30 09:53:01'),
(399, 8, 75, 2, '2025-07-30 09:53:01'),
(400, 11, 75, 5, '2025-07-30 09:53:01'),
(401, 3, 73, 1, '2025-08-10 13:28:34'),
(402, 3, 181, 2, '2025-08-10 13:29:57'),
(403, 6, 181, 2, '2025-08-10 13:29:57'),
(404, 8, 181, 4, '2025-08-10 13:29:57'),
(405, 13, 181, 1, '2025-08-10 13:29:57'),
(406, 3, 182, 1, '2025-08-10 13:40:38'),
(407, 6, 182, 2, '2025-08-10 13:40:38'),
(408, 8, 182, 1, '2025-08-10 13:40:38'),
(409, 13, 182, 1, '2025-08-10 13:40:38'),
(410, 3, 183, NULL, '2025-08-10 14:42:25'),
(411, 6, 183, NULL, '2025-08-10 14:42:25'),
(412, 8, 183, NULL, '2025-08-10 14:42:25'),
(413, 13, 183, 1, '2025-08-10 14:42:25'),
(414, 3, 184, 2, '2025-08-10 14:43:21'),
(415, 6, 184, 2, '2025-08-10 14:43:21'),
(416, 8, 184, 2, '2025-08-10 14:43:21'),
(417, 13, 184, 2, '2025-08-10 14:43:21'),
(418, 3, 185, NULL, '2025-08-10 15:03:06'),
(419, 6, 185, NULL, '2025-08-10 15:03:06'),
(420, 8, 185, NULL, '2025-08-10 15:03:06'),
(421, 13, 185, 2, '2025-08-10 15:03:06'),
(422, 7, 184, 1, '2025-08-10 16:20:18'),
(423, 11, 184, 2, '2025-08-10 16:20:20'),
(424, 12, 184, 5, '2025-08-27 11:28:43'),
(432, 13, 17, 1, '2025-09-04 13:04:10'),
(433, 13, 68, 1, '2025-09-04 13:04:14'),
(434, 13, 67, 2, '2025-09-04 13:04:17'),
(435, 13, 66, 1, '2025-09-04 13:04:20'),
(436, 13, 65, 1, '2025-09-04 13:04:23'),
(437, 13, 72, 1, '2025-09-04 13:04:26'),
(438, 13, 9, 1, '2025-10-07 10:30:25'),
(439, 13, 18, 2, '2025-10-07 10:30:27'),
(440, 13, 5, 2, '2025-10-11 21:24:46'),
(441, 13, 4, 1, '2025-10-14 16:39:33'),
(442, 13, 2, 2, '2025-10-14 16:39:35'),
(443, 13, 1, 2, '2025-10-14 16:39:38'),
(444, 13, 26, 1, '2025-10-14 16:39:44'),
(445, 13, 25, 2, '2025-10-14 16:39:47'),
(446, 13, 64, 2, '2025-10-14 16:39:49'),
(447, 13, 63, 1, '2025-10-14 16:39:51'),
(448, 13, 12, 2, '2025-10-14 16:39:53'),
(449, 13, 20, 1, '2025-10-14 16:39:57'),
(450, 13, 74, 1, '2025-10-14 16:40:00'),
(451, 13, 19, 2, '2025-10-14 16:40:02'),
(452, 13, 8, 1, '2025-10-14 16:40:06'),
(453, 13, 11, 2, '2025-10-14 16:40:08'),
(454, 13, 7, 1, '2025-10-14 16:40:10'),
(455, 13, 6, 2, '2025-10-14 16:40:13'),
(456, 13, 23, 3, '2025-10-14 16:40:19'),
(457, 13, 71, 3, '2025-10-14 16:40:21'),
(458, 13, 13, 3, '2025-10-14 16:40:23'),
(459, 13, 24, 3, '2025-10-14 16:40:26'),
(460, 13, 15, 2, '2025-10-14 16:40:32'),
(461, 13, 16, 5, '2025-10-14 16:40:33'),
(462, 13, 69, 5, '2025-10-14 16:40:35'),
(463, 13, 14, 5, '2025-10-14 16:40:38'),
(464, 13, 21, 2, '2025-10-14 16:40:45'),
(465, 13, 22, 5, '2025-10-14 16:40:47'),
(466, 13, 70, 3, '2025-10-14 16:40:49'),
(467, 13, 3, 3, '2025-10-14 16:40:51'),
(468, 13, 34, 4, '2025-10-14 16:40:57'),
(469, 13, 33, 4, '2025-10-14 16:41:00'),
(470, 13, 28, 3, '2025-10-14 16:41:04'),
(471, 13, 27, 2, '2025-10-14 16:41:05'),
(472, 13, 32, 2, '2025-10-14 16:41:09'),
(473, 13, 31, 4, '2025-10-14 16:41:11'),
(474, 13, 36, 2, '2025-10-14 16:41:14'),
(475, 13, 35, 1, '2025-10-14 16:41:18'),
(476, 13, 38, 5, '2025-10-14 16:41:22'),
(477, 13, 37, 4, '2025-10-14 16:41:25'),
(478, 13, 29, 2, '2025-10-14 16:41:29'),
(479, 13, 73, 2, '2025-10-14 16:41:31'),
(480, 13, 30, 4, '2025-10-14 16:41:34'),
(481, 13, 10, 4, '2025-10-14 16:41:37'),
(482, 13, 42, 2, '2025-10-14 16:41:42'),
(483, 13, 41, 5, '2025-10-14 16:41:44'),
(484, 13, 50, 2, '2025-10-14 16:41:48'),
(485, 13, 49, 4, '2025-10-14 16:41:50'),
(486, 13, 44, 3, '2025-10-14 16:41:54'),
(487, 13, 43, 4, '2025-10-14 16:41:56'),
(488, 13, 48, 3, '2025-10-14 16:42:00'),
(489, 13, 47, 3, '2025-10-14 16:42:02'),
(490, 13, 40, 2, '2025-10-14 16:42:07'),
(491, 13, 39, 5, '2025-10-14 16:42:09'),
(492, 13, 46, 1, '2025-10-14 16:42:13'),
(493, 13, 45, 5, '2025-10-14 16:42:15'),
(494, 13, 58, 2, '2025-10-14 16:42:22'),
(495, 13, 57, 1, '2025-10-14 16:42:24'),
(496, 13, 52, 2, '2025-10-14 16:42:27'),
(497, 13, 51, 2, '2025-10-14 16:42:30'),
(498, 13, 60, 1, '2025-10-14 16:42:33'),
(499, 13, 59, 1, '2025-10-14 16:42:36'),
(500, 13, 56, 2, '2025-10-14 16:42:40'),
(501, 13, 55, 1, '2025-10-14 16:42:42'),
(502, 13, 75, 1, '2025-10-14 16:42:46'),
(503, 13, 62, 1, '2025-10-14 16:42:48'),
(504, 13, 61, 1, '2025-10-14 16:42:50'),
(505, 13, 54, 1, '2025-10-14 16:42:54'),
(506, 13, 53, 2, '2025-10-14 16:42:57'),
(507, 6, 186, 1, '2025-10-14 16:59:49'),
(508, 8, 186, 2, '2025-10-14 16:59:49'),
(509, 11, 186, 4, '2025-10-14 16:59:49'),
(510, 13, 186, 3, '2025-10-14 16:59:49');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `user_id` int(11) NOT NULL,
  `user_role` int(11) NOT NULL,
  `user_pass` varchar(255) NOT NULL,
  `user_firstname` varchar(100) NOT NULL,
  `user_middlename` varchar(100) DEFAULT NULL,
  `user_lastname` varchar(100) NOT NULL,
  `user_birthdate` date NOT NULL,
  `user_email` varchar(150) NOT NULL,
  `user_contact_no` varchar(20) DEFAULT NULL,
  `user_photo` text DEFAULT NULL,
  `user_status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `is_new` enum('Yes','No') NOT NULL DEFAULT 'Yes',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`user_id`, `user_role`, `user_pass`, `user_firstname`, `user_middlename`, `user_lastname`, `user_birthdate`, `user_email`, `user_contact_no`, `user_photo`, `user_status`, `is_new`, `created_at`) VALUES
(1, 1, '$2y$10$3SBEHga4jhYEVng5aXqBq.cvUHj6V0xHlwazUyjvQO3.nXY4O0cxO', 'Chansss', 'Ejay', 'Clarino', '1980-01-01', 'clarsejay@gmail.com', '09999999928', 'img_rt862_521353664_122142780386746700_7941014526230096732_n.jpg', 'Active', 'No', '2025-06-24 14:32:19'),
(2, 2, '$2y$10$wyH7Tcy5VXQVLEDed8USlOEC7sjlFYoNOLLCMO.pd8JyEvZoNrOMS', 'Kristopher', 'Chos', 'Dichos', '1990-01-01', 'dichoskristopher@gmail.com', '09918123333', 'img_lv38z_2.png', 'Active', 'No', '2025-06-24 14:32:19'),
(3, 2, '$2y$10$qBYcdXlmymfYWk1GNMaHH.4hJB8K3Ft4G0L0v7gi4Ph0zvXceuCyG', 'Andrew', 'Lara', 'Nerona', '1985-03-10', 'paulandrewnerona@gmail.com', '09991922345', 'img_615dj_hmm.jpg', 'Active', 'No', '2025-06-24 14:32:19'),
(4, 3, '$2y$10$HLEVSDz7.DDhXR4AXeCUK.PFXSurB0BpWMyQ.Y09NeTuIglsP6H62', 'Angela', 'Teresa', 'Borres', '1990-01-01', 'angelaborres@gmail.com', '09201234567', 'default_teacher.png', 'Active', 'No', '2025-06-24 14:32:19'),
(5, 3, '$2y$10$CPLO02gUKBJlcRYbJePch.NDwz6DZX2ZSueECGhH6aGSBbfyrTU1e', 'Jessa', 'Hambora', 'Decena', '1990-03-13', 'decenajessa03@gmail.com', '09999999203', 'img_grpbo_3.png', 'Active', 'No', '2025-06-24 14:32:19'),
(6, 4, '$2b$12$AaP/nnlUHKVkLi.z3LhT0..8L3Cbv0N3gEJJgzPRgf4hujYEM7Kg.', 'Carla', 'Sankwago', 'Tango', '1990-01-01', 'carla@gmail.com', '09221234567', 'default_parent.png', 'Active', 'No', '2025-06-24 14:32:19'),
(7, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Bryan', 'Jimenez', 'Lopez', '1989-11-03', 'bryan@gmail.com', '09231234567', 'default_parent.png', 'Active', 'Yes', '2025-06-24 14:32:19'),
(8, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Elaine', 'Dela Cruz', 'Mendoza', '1993-12-27', 'elaine@gmail.com', '09241234567', 'default_parent.png', 'Active', 'Yes', '2025-06-24 14:32:19'),
(9, 3, '$2y$10$RJRnyP5Y1yfLSvE/SzuLIe6c4gfeML0d1SBYKtdoq.vMz8UAFLg8.', 'Jess', '', 'Morcillos', '1987-04-14', 'jessmorcillos@gmail.com', '09351234567', 'default_teacher.png', 'Active', 'No', '2025-06-24 14:32:19'),
(10, 3, '$2y$10$9dMjI8fcXyDIJnhEpMQKqeazGZozbckYOmd/hbPqHbp7O3yYKoC0m', 'Johanna', 'Puerto', 'Ebarat', '1984-09-28', 'johannaebarat@gmail.com', '09361234567', 'default_teacher.png', 'Active', 'No', '2025-06-24 14:32:19'),
(11, 3, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Grace', 'Fernandez', 'Torres', '1988-12-03', 'grace@gmail.com', '09371234567', 'default_teacher.png', 'Inactive', 'Yes', '2025-06-24 14:32:19'),
(12, 3, '$2y$10$XrGhRnQUqKXKqmaRNv5VCOdD/pahVa3Nbi7gyI0u8l4sXOqdGx0z2', 'Marg', 'Villanueva', 'Reyes', '1990-09-10', 'marg@gmail.com', '09381234567', 'default_teacher.png', 'Active', 'No', '2025-06-24 14:42:55'),
(13, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Juliet', '', 'Roms', '1990-02-01', 'juliet@gmail.com', '09283494757', 'default_admin.png', 'Inactive', 'Yes', '2025-06-28 08:29:43'),
(14, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Chris', '', 'Johans', '2000-01-01', 'johans@gmail.com', '', 'default_admin.png', 'Inactive', 'Yes', '2025-06-28 10:02:28'),
(15, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Laurzenz', 'Montizor', 'Anches', '1987-06-02', 'laurenz@gmail.com', '', 'default_admin.png', 'Active', 'Yes', '2025-06-28 10:05:15'),
(16, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Junel', '', 'Baterna', '1983-06-02', 'junel@gmail.com', '09293234632', 'default_admin.png', 'Active', 'Yes', '2025-06-28 10:06:47'),
(17, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Fritz', '', 'Turtoza', '1990-03-29', 'fritz@gmail.com', '', 'default_admin.png', 'Inactive', 'Yes', '2025-06-28 18:19:30'),
(18, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Armie', '', 'Timbal', '1998-06-03', 'armie@gmail.com', '', 'default_parent.png', 'Active', 'Yes', '2025-06-29 07:34:55'),
(19, 3, '$2y$10$Y6GEluHpmTZTBUbP494YCeXNHw4jEAIZHfnHXsSagx0bb1fycVnY6', 'Clyde', 'Denzel', 'Parol', '1993-02-06', 'clydedenzel@gmail.com', '09361234533', 'default_teacher.png', 'Active', 'No', '2025-06-29 13:02:47'),
(20, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Carme', '', 'Sam', '1994-06-04', 'carme@gmail.com', '', 'default_parent.png', 'Active', 'Yes', '2025-06-29 13:03:30'),
(21, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Grazel', 'Mae', 'Eve', '1995-06-10', 'grazel@gmail.com', '', 'default_parent.png', 'Active', 'Yes', '2025-06-30 11:12:27'),
(22, 3, '$2y$10$rexKryM4Ep.h0HUCfmpl1.KoSNg7lqQexeJsETFAxjH2i55yFXxcy', 'Janneth', '', 'Caamino', '1994-06-04', 'jannethcaamino@gmail.com', '09171234654', 'default_teacher.png', 'Active', 'No', '2025-06-30 11:15:13'),
(23, 4, '$2y$10$em/CoMFNY1tjX8/ON.1x7.zpc2Bu3VbE55C.wM2oL1mrhZY/iTQUe', 'Margareths', 'Pabunan', 'Manongdo', '2004-01-01', 'manongdomargareth1335@gmail.com', '09995673429', 'img_2x5u6_received_434388112205137.jpeg', 'Active', 'No', '2025-06-30 11:31:59'),
(24, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Andrea', 'Marie', 'Plamos', '1999-06-02', 'andrea@gmail.com', '', 'default_parent.png', 'Active', 'Yes', '2025-06-30 11:49:53'),
(25, 4, '$2y$10$VPrm1.Dr5ebqABAqJopH7OvYEKH3o5IolrTaV01SBLZcAwanrlpGy', 'Lyca', 'Round', 'Cantilado', '1996-06-10', 'laycs12@gmail.com', '09992837463', 'img_wnjdk_4.png', 'Active', 'No', '2025-06-30 12:23:31'),
(26, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Jacob', '', 'Paguta', '1984-02-22', 'jacob@gmail.com', '', 'default_parent.png', 'Inactive', 'Yes', '2025-07-13 10:08:32'),
(27, 3, '$2y$10$AkyOlHaBUWUY6tA00kbtT.EG0oWIjatJwCQ1kH1z1mj7FGdKA4l9a', 'Quennilyn', '', 'Galarpe', '1997-06-04', 'galarpequennielyn25@gmail.com', '09917123412', 'img_t1xch_staff_gc_photo.jpg', 'Active', 'No', '2025-07-15 06:17:58'),
(28, 4, '$2y$10$cgYa2YXBjNok6vsTEacAw.iTtHec8qCjZd7t.XoKRXEAIUzl.ou2G', 'James', 'Anthony', 'Placido', '1989-01-02', 'james@gmail.com', '09917123456', 'default_parent.png', 'Active', 'No', '2025-07-16 10:09:00'),
(29, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Glecie', '', 'Madrenos', '1985-02-22', 'glecie@gmail.com', '09283624523', 'default_parent.png', 'Active', 'Yes', '2025-08-07 11:55:05'),
(30, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Jennevive', '', 'Cabug', '1998-02-22', 'jen@gmail.com', '09283658324', 'default_parent.png', 'Active', 'Yes', '2025-08-08 16:36:10'),
(31, 4, '$2y$10$mktIApIDvIS6cUqQuuWm8uq4AgdTWmB2dw1lOZ3RAzKfHONdV8YXC', 'Shai', '', 'Tabs', '2000-02-26', 'shairatabs@gmail.com', '09344736244', 'default_parent.png', 'Active', 'No', '2025-08-10 09:26:03'),
(32, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Anne', 'Shril', 'Suclatan', '1999-05-31', 'anne@gmail.com', '09203847563', 'default_parent.png', 'Active', 'Yes', '2025-08-20 17:25:25'),
(33, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Raniel', 'Santan', 'Tacal', '1989-07-05', 'raniel@gmail.com', '09856738573', 'default_parent.png', 'Active', 'Yes', '2025-08-20 17:28:37'),
(34, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Jonathan', '', 'Cartagena', '1920-02-22', 'thanthan@gmail.com', '09430585738', 'default_parent.png', 'Active', 'Yes', '2025-08-22 14:45:55'),
(35, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Elmer', '', 'Amorin', '2000-02-22', 'amorin@gmail.com', '09476736363', 'default_admin.png', 'Active', 'Yes', '2025-08-30 17:01:36'),
(36, 3, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'May', 'La', 'San', '2000-02-22', 'mayla@gmail.com', '09375673846', 'default_teacher.png', 'Active', 'Yes', '2025-08-30 17:05:04'),
(37, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Ysabel', 'Beabie', 'Binene', '2000-02-22', 'ysable@gmail.com', '09373467646', 'default_parent.png', 'Active', 'Yes', '2025-08-30 17:06:14'),
(38, 3, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Jan', 'Nichols', 'Maris', '1999-02-22', 'janix@gmail.com', '09383734673', 'default_teacher.png', 'Active', 'Yes', '2025-08-31 16:25:28'),
(39, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Christian', '', 'Butaks', '1980-02-22', 'butaks@gmail.com', '09282373673', 'default_parent.png', 'Active', 'Yes', '2025-08-31 16:26:08'),
(40, 2, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Mike', '', 'Altahan', '2000-02-22', 'althan@gmail.com', '09287367464', 'default_admin.png', 'Active', 'Yes', '2025-10-14 08:58:01'),
(41, 4, '$2y$10$V7J20onJXDV0czenr4mMI.L6zD7ynnneE4hBU1KjxS9z3/M/gLCKO', 'Eve', '', 'Bogarts', '2000-10-02', 'evegely@gmail.com', '09374467646', 'default_parent.png', 'Active', 'Yes', '2025-10-14 08:59:53'),
(42, 3, '$2y$10$x6QquqpE.S3goMPjFWVlLuGr1hlAtqSsAVph9/7/c.BLGUBsPBcTi', 'George', '', 'Town', '2000-02-22', 'Georgetown@gmail.com', '', 'default_teacher.png', 'Active', 'Yes', '2025-10-21 16:17:21'),
(43, 4, '$2y$10$ykl4Eh2AubMeI2T6WSCpKeZt2VspyTYsYQzZ0Q2FBrFz2hQ6fWWLW', 'Hhjhj', '', 'Fggffgfg', '2000-04-04', 'hgghhg@gmail.com', '', 'default_parent.png', 'Active', 'Yes', '2025-10-21 16:18:08');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_visual_feedback`
--

CREATE TABLE `tbl_visual_feedback` (
  `visual_feedback_id` int(11) NOT NULL,
  `visual_feedback_shape` varchar(100) NOT NULL,
  `visual_feedback_name` varchar(100) NOT NULL,
  `visual_feedback_description` text DEFAULT NULL,
  `min_score` decimal(4,3) DEFAULT NULL,
  `max_score` decimal(4,3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_visual_feedback`
--

INSERT INTO `tbl_visual_feedback` (`visual_feedback_id`, `visual_feedback_shape`, `visual_feedback_name`, `visual_feedback_description`, `min_score`, `max_score`) VALUES
(1, '♥', 'Heart', 'Excellent', 4.200, 5.000),
(2, '★', 'Star', 'Very Good', 3.400, 4.199),
(3, '◆', 'Diamond', 'Good', 2.600, 3.399),
(4, '▲', 'Triangle', 'Need Help', 1.800, 2.599),
(5, '⬤', 'Circle', 'Not Met', 1.000, 1.799);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_activities`
--
ALTER TABLE `tbl_activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `advisory_id` (`advisory_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `fk_quarter` (`quarter_id`);

--
-- Indexes for table `tbl_add_info`
--
ALTER TABLE `tbl_add_info`
  ADD PRIMARY KEY (`add_info_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_advisory`
--
ALTER TABLE `tbl_advisory`
  ADD PRIMARY KEY (`advisory_id`),
  ADD KEY `lead_teacher_id` (`lead_teacher_id`),
  ADD KEY `fk_assistant_teacher` (`assistant_teacher_id`),
  ADD KEY `fk_advisory_level` (`level_id`);

--
-- Indexes for table `tbl_attendance`
--
ALTER TABLE `tbl_attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `tbl_communication`
--
ALTER TABLE `tbl_communication`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_receiver` (`receiver_id`),
  ADD KEY `idx_pair_time` (`sender_id`,`receiver_id`,`sent_at`);

--
-- Indexes for table `tbl_comm_group`
--
ALTER TABLE `tbl_comm_group`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `idx_type` (`group_type`),
  ADD KEY `idx_ref` (`group_ref_id`);

--
-- Indexes for table `tbl_comm_group_message`
--
ALTER TABLE `tbl_comm_group_message`
  ADD PRIMARY KEY (`group_message_id`),
  ADD KEY `idx_group_time` (`group_id`,`sent_at`),
  ADD KEY `idx_sender` (`sender_id`);

--
-- Indexes for table `tbl_comm_group_read`
--
ALTER TABLE `tbl_comm_group_read`
  ADD PRIMARY KEY (`group_message_id`,`user_id`),
  ADD KEY `fk_cgr_user` (`user_id`);

--
-- Indexes for table `tbl_meetings`
--
ALTER TABLE `tbl_meetings`
  ADD PRIMARY KEY (`meeting_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `advisory_id` (`advisory_id`);

--
-- Indexes for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `meeting_id` (`meeting_id`);

--
-- Indexes for table `tbl_notification_admin_views`
--
ALTER TABLE `tbl_notification_admin_views`
  ADD PRIMARY KEY (`user_id`,`notification_id`),
  ADD KEY `idx_user_time` (`user_id`,`viewed_at`),
  ADD KEY `fk_nav_notif` (`notification_id`);

--
-- Indexes for table `tbl_notification_recipients`
--
ALTER TABLE `tbl_notification_recipients`
  ADD PRIMARY KEY (`recipient_id`),
  ADD KEY `notification_id` (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_notif_user` (`notification_id`,`user_id`);

--
-- Indexes for table `tbl_otp_verification`
--
ALTER TABLE `tbl_otp_verification`
  ADD PRIMARY KEY (`otp_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_overall_progress`
--
ALTER TABLE `tbl_overall_progress`
  ADD PRIMARY KEY (`overall_progress_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `advisory_id` (`advisory_id`),
  ADD KEY `overall_visual_feedback_id` (`overall_visual_feedback_id`),
  ADD KEY `fk_overall_risk` (`risk_id`);

--
-- Indexes for table `tbl_overall_progress_links`
--
ALTER TABLE `tbl_overall_progress_links`
  ADD PRIMARY KEY (`link_id`),
  ADD KEY `card_id` (`card_id`),
  ADD KEY `overall_progress_id` (`overall_progress_id`);

--
-- Indexes for table `tbl_overall_summaries`
--
ALTER TABLE `tbl_overall_summaries`
  ADD PRIMARY KEY (`overall_summary_id`),
  ADD KEY `risk_id` (`risk_id`);

--
-- Indexes for table `tbl_parents_profile`
--
ALTER TABLE `tbl_parents_profile`
  ADD PRIMARY KEY (`parent_profile_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_progress_cards`
--
ALTER TABLE `tbl_progress_cards`
  ADD PRIMARY KEY (`card_id`),
  ADD UNIQUE KEY `unique_progress` (`student_id`,`advisory_id`,`quarter_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `advisory_id` (`advisory_id`),
  ADD KEY `quarter_id` (`quarter_id`),
  ADD KEY `risk_id` (`risk_id`),
  ADD KEY `fk_quarter_visual_feedback` (`quarter_visual_feedback_id`),
  ADD KEY `fk_finalized_by_user` (`finalized_by`);

--
-- Indexes for table `tbl_progress_comments`
--
ALTER TABLE `tbl_progress_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `quarter_id` (`quarter_id`),
  ADD KEY `fk_progress_comments_student` (`student_id`),
  ADD KEY `fk_progress_comments_user` (`commentor_id`);

--
-- Indexes for table `tbl_progress_notification`
--
ALTER TABLE `tbl_progress_notification`
  ADD PRIMARY KEY (`progress_notif_id`),
  ADD KEY `fk_progress_notif_notification` (`notification_id`),
  ADD KEY `fk_progress_notif_quarter` (`quarter_id`),
  ADD KEY `fk_progress_notif_student` (`student_id`);

--
-- Indexes for table `tbl_quarters`
--
ALTER TABLE `tbl_quarters`
  ADD PRIMARY KEY (`quarter_id`);

--
-- Indexes for table `tbl_quarter_feedback`
--
ALTER TABLE `tbl_quarter_feedback`
  ADD PRIMARY KEY (`quarter_feedback_id`),
  ADD UNIQUE KEY `uq_student_quarter_subject` (`student_id`,`quarter_id`,`subject_id`),
  ADD KEY `quarter_id` (`quarter_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `majority_feedback_id` (`visual_feedback_id`);

--
-- Indexes for table `tbl_risk_levels`
--
ALTER TABLE `tbl_risk_levels`
  ADD PRIMARY KEY (`risk_id`);

--
-- Indexes for table `tbl_risk_summaries`
--
ALTER TABLE `tbl_risk_summaries`
  ADD PRIMARY KEY (`summary_id`);

--
-- Indexes for table `tbl_roles`
--
ALTER TABLE `tbl_roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `tbl_routines`
--
ALTER TABLE `tbl_routines`
  ADD PRIMARY KEY (`routine_id`);

--
-- Indexes for table `tbl_schedule`
--
ALTER TABLE `tbl_schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `level_id` (`level_id`),
  ADD KEY `schedule_item_id` (`schedule_item_id`);

--
-- Indexes for table `tbl_schedule_items`
--
ALTER TABLE `tbl_schedule_items`
  ADD PRIMARY KEY (`schedule_item_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `routine_id` (`routine_id`),
  ADD KEY `fk_subject2` (`subject_id_2`),
  ADD KEY `fk_routine2` (`routine_id_2`);

--
-- Indexes for table `tbl_shapes`
--
ALTER TABLE `tbl_shapes`
  ADD PRIMARY KEY (`shape_id`);

--
-- Indexes for table `tbl_students`
--
ALTER TABLE `tbl_students`
  ADD PRIMARY KEY (`student_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `level_id` (`level_id`),
  ADD KEY `fk_parent_profile` (`parent_profile_id`);

--
-- Indexes for table `tbl_student_assigned`
--
ALTER TABLE `tbl_student_assigned`
  ADD PRIMARY KEY (`assigned_id`),
  ADD KEY `advisory_id` (`advisory_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `tbl_student_levels`
--
ALTER TABLE `tbl_student_levels`
  ADD PRIMARY KEY (`level_id`);

--
-- Indexes for table `tbl_student_milestone_interpretation`
--
ALTER TABLE `tbl_student_milestone_interpretation`
  ADD PRIMARY KEY (`milestone_id`),
  ADD KEY `fk_milestone_student` (`student_id`),
  ADD KEY `fk_milestone_progress` (`overall_progress_id`);

--
-- Indexes for table `tbl_subjects`
--
ALTER TABLE `tbl_subjects`
  ADD PRIMARY KEY (`subject_id`);

--
-- Indexes for table `tbl_subject_overall_progress`
--
ALTER TABLE `tbl_subject_overall_progress`
  ADD PRIMARY KEY (`subject_overall_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `advisory_id` (`advisory_id`),
  ADD KEY `finalsubj_visual_feedback_id` (`finalsubj_visual_feedback_id`);

--
-- Indexes for table `tbl_system_logs`
--
ALTER TABLE `tbl_system_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_target_user` (`target_user_id`),
  ADD KEY `fk_target_student` (`target_student_id`);

--
-- Indexes for table `tbl_tracking_adventurer`
--
ALTER TABLE `tbl_tracking_adventurer`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `visual_feedback_id` (`visual_feedback_id`),
  ADD KEY `idx_tracking_adventurer_student_activity` (`student_id`,`activity_id`);

--
-- Indexes for table `tbl_tracking_discoverer`
--
ALTER TABLE `tbl_tracking_discoverer`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `visual_feedback_id` (`visual_feedback_id`),
  ADD KEY `idx_tracking_discoverer_student_activity` (`student_id`,`activity_id`);

--
-- Indexes for table `tbl_tracking_explorer`
--
ALTER TABLE `tbl_tracking_explorer`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `visual_feedback_id` (`visual_feedback_id`),
  ADD KEY `idx_tracking_explorer_student_activity` (`student_id`,`activity_id`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `user_role` (`user_role`);

--
-- Indexes for table `tbl_visual_feedback`
--
ALTER TABLE `tbl_visual_feedback`
  ADD PRIMARY KEY (`visual_feedback_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_activities`
--
ALTER TABLE `tbl_activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=187;

--
-- AUTO_INCREMENT for table `tbl_add_info`
--
ALTER TABLE `tbl_add_info`
  MODIFY `add_info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `tbl_advisory`
--
ALTER TABLE `tbl_advisory`
  MODIFY `advisory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_attendance`
--
ALTER TABLE `tbl_attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=191;

--
-- AUTO_INCREMENT for table `tbl_communication`
--
ALTER TABLE `tbl_communication`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `tbl_comm_group`
--
ALTER TABLE `tbl_comm_group`
  MODIFY `group_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_comm_group_message`
--
ALTER TABLE `tbl_comm_group_message`
  MODIFY `group_message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `tbl_meetings`
--
ALTER TABLE `tbl_meetings`
  MODIFY `meeting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `tbl_notification_recipients`
--
ALTER TABLE `tbl_notification_recipients`
  MODIFY `recipient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=891;

--
-- AUTO_INCREMENT for table `tbl_otp_verification`
--
ALTER TABLE `tbl_otp_verification`
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `tbl_overall_progress`
--
ALTER TABLE `tbl_overall_progress`
  MODIFY `overall_progress_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_overall_progress_links`
--
ALTER TABLE `tbl_overall_progress_links`
  MODIFY `link_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `tbl_overall_summaries`
--
ALTER TABLE `tbl_overall_summaries`
  MODIFY `overall_summary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_parents_profile`
--
ALTER TABLE `tbl_parents_profile`
  MODIFY `parent_profile_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tbl_progress_cards`
--
ALTER TABLE `tbl_progress_cards`
  MODIFY `card_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `tbl_progress_comments`
--
ALTER TABLE `tbl_progress_comments`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_progress_notification`
--
ALTER TABLE `tbl_progress_notification`
  MODIFY `progress_notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `tbl_quarters`
--
ALTER TABLE `tbl_quarters`
  MODIFY `quarter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_quarter_feedback`
--
ALTER TABLE `tbl_quarter_feedback`
  MODIFY `quarter_feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=925;

--
-- AUTO_INCREMENT for table `tbl_risk_levels`
--
ALTER TABLE `tbl_risk_levels`
  MODIFY `risk_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_risk_summaries`
--
ALTER TABLE `tbl_risk_summaries`
  MODIFY `summary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `tbl_roles`
--
ALTER TABLE `tbl_roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_routines`
--
ALTER TABLE `tbl_routines`
  MODIFY `routine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_schedule`
--
ALTER TABLE `tbl_schedule`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `tbl_schedule_items`
--
ALTER TABLE `tbl_schedule_items`
  MODIFY `schedule_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `tbl_shapes`
--
ALTER TABLE `tbl_shapes`
  MODIFY `shape_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_students`
--
ALTER TABLE `tbl_students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `tbl_student_assigned`
--
ALTER TABLE `tbl_student_assigned`
  MODIFY `assigned_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `tbl_student_levels`
--
ALTER TABLE `tbl_student_levels`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_student_milestone_interpretation`
--
ALTER TABLE `tbl_student_milestone_interpretation`
  MODIFY `milestone_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_subjects`
--
ALTER TABLE `tbl_subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_subject_overall_progress`
--
ALTER TABLE `tbl_subject_overall_progress`
  MODIFY `subject_overall_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `tbl_system_logs`
--
ALTER TABLE `tbl_system_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=470;

--
-- AUTO_INCREMENT for table `tbl_tracking_adventurer`
--
ALTER TABLE `tbl_tracking_adventurer`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=172;

--
-- AUTO_INCREMENT for table `tbl_tracking_discoverer`
--
ALTER TABLE `tbl_tracking_discoverer`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=289;

--
-- AUTO_INCREMENT for table `tbl_tracking_explorer`
--
ALTER TABLE `tbl_tracking_explorer`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=511;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `tbl_visual_feedback`
--
ALTER TABLE `tbl_visual_feedback`
  MODIFY `visual_feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_activities`
--
ALTER TABLE `tbl_activities`
  ADD CONSTRAINT `fk_quarter` FOREIGN KEY (`quarter_id`) REFERENCES `tbl_quarters` (`quarter_id`),
  ADD CONSTRAINT `tbl_activities_ibfk_1` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`),
  ADD CONSTRAINT `tbl_activities_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subjects` (`subject_id`);

--
-- Constraints for table `tbl_add_info`
--
ALTER TABLE `tbl_add_info`
  ADD CONSTRAINT `tbl_add_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_advisory`
--
ALTER TABLE `tbl_advisory`
  ADD CONSTRAINT `fk_advisory_level` FOREIGN KEY (`level_id`) REFERENCES `tbl_student_levels` (`level_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assistant_teacher` FOREIGN KEY (`assistant_teacher_id`) REFERENCES `tbl_users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_advisory_ibfk_1` FOREIGN KEY (`lead_teacher_id`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_attendance`
--
ALTER TABLE `tbl_attendance`
  ADD CONSTRAINT `tbl_attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `tbl_attendance_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_communication`
--
ALTER TABLE `tbl_communication`
  ADD CONSTRAINT `fk_comm_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comm_sender` FOREIGN KEY (`sender_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_comm_group`
--
ALTER TABLE `tbl_comm_group`
  ADD CONSTRAINT `fk_group_ref` FOREIGN KEY (`group_ref_id`) REFERENCES `tbl_advisory` (`advisory_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_comm_group_message`
--
ALTER TABLE `tbl_comm_group_message`
  ADD CONSTRAINT `fk_cgmsg_group` FOREIGN KEY (`group_id`) REFERENCES `tbl_comm_group` (`group_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cgmsg_sender` FOREIGN KEY (`sender_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_comm_group_read`
--
ALTER TABLE `tbl_comm_group_read`
  ADD CONSTRAINT `fk_cgr_msg` FOREIGN KEY (`group_message_id`) REFERENCES `tbl_comm_group_message` (`group_message_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cgr_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_meetings`
--
ALTER TABLE `tbl_meetings`
  ADD CONSTRAINT `tbl_meetings_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_meetings_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_meetings_ibfk_3` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  ADD CONSTRAINT `tbl_notifications_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_notifications_ibfk_2` FOREIGN KEY (`meeting_id`) REFERENCES `tbl_meetings` (`meeting_id`);

--
-- Constraints for table `tbl_notification_admin_views`
--
ALTER TABLE `tbl_notification_admin_views`
  ADD CONSTRAINT `fk_nav_notif` FOREIGN KEY (`notification_id`) REFERENCES `tbl_notifications` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_nav_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_notification_recipients`
--
ALTER TABLE `tbl_notification_recipients`
  ADD CONSTRAINT `tbl_notification_recipients_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `tbl_notifications` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_notification_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_otp_verification`
--
ALTER TABLE `tbl_otp_verification`
  ADD CONSTRAINT `tbl_otp_verification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_overall_progress`
--
ALTER TABLE `tbl_overall_progress`
  ADD CONSTRAINT `fk_overall_risk` FOREIGN KEY (`risk_id`) REFERENCES `tbl_risk_levels` (`risk_id`),
  ADD CONSTRAINT `tbl_overall_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `tbl_overall_progress_ibfk_2` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`),
  ADD CONSTRAINT `tbl_overall_progress_ibfk_3` FOREIGN KEY (`overall_visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`);

--
-- Constraints for table `tbl_overall_progress_links`
--
ALTER TABLE `tbl_overall_progress_links`
  ADD CONSTRAINT `tbl_overall_progress_links_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `tbl_progress_cards` (`card_id`),
  ADD CONSTRAINT `tbl_overall_progress_links_ibfk_2` FOREIGN KEY (`overall_progress_id`) REFERENCES `tbl_overall_progress` (`overall_progress_id`);

--
-- Constraints for table `tbl_overall_summaries`
--
ALTER TABLE `tbl_overall_summaries`
  ADD CONSTRAINT `tbl_overall_summaries_ibfk_1` FOREIGN KEY (`risk_id`) REFERENCES `tbl_risk_levels` (`risk_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_parents_profile`
--
ALTER TABLE `tbl_parents_profile`
  ADD CONSTRAINT `tbl_parents_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_progress_cards`
--
ALTER TABLE `tbl_progress_cards`
  ADD CONSTRAINT `fk_finalized_by_user` FOREIGN KEY (`finalized_by`) REFERENCES `tbl_users` (`user_id`),
  ADD CONSTRAINT `fk_quarter_visual_feedback` FOREIGN KEY (`quarter_visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`),
  ADD CONSTRAINT `tbl_progress_cards_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `tbl_progress_cards_ibfk_2` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`),
  ADD CONSTRAINT `tbl_progress_cards_ibfk_3` FOREIGN KEY (`quarter_id`) REFERENCES `tbl_quarters` (`quarter_id`),
  ADD CONSTRAINT `tbl_progress_cards_ibfk_5` FOREIGN KEY (`risk_id`) REFERENCES `tbl_risk_levels` (`risk_id`);

--
-- Constraints for table `tbl_progress_comments`
--
ALTER TABLE `tbl_progress_comments`
  ADD CONSTRAINT `fk_progress_comments_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `fk_progress_comments_user` FOREIGN KEY (`commentor_id`) REFERENCES `tbl_users` (`user_id`),
  ADD CONSTRAINT `tbl_progress_comments_ibfk_2` FOREIGN KEY (`quarter_id`) REFERENCES `tbl_quarters` (`quarter_id`);

--
-- Constraints for table `tbl_progress_notification`
--
ALTER TABLE `tbl_progress_notification`
  ADD CONSTRAINT `fk_progress_notif_notification` FOREIGN KEY (`notification_id`) REFERENCES `tbl_notifications` (`notification_id`),
  ADD CONSTRAINT `fk_progress_notif_quarter` FOREIGN KEY (`quarter_id`) REFERENCES `tbl_quarters` (`quarter_id`),
  ADD CONSTRAINT `fk_progress_notif_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`);

--
-- Constraints for table `tbl_quarter_feedback`
--
ALTER TABLE `tbl_quarter_feedback`
  ADD CONSTRAINT `tbl_quarter_feedback_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_quarter_feedback_ibfk_2` FOREIGN KEY (`quarter_id`) REFERENCES `tbl_quarters` (`quarter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_quarter_feedback_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subjects` (`subject_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_quarter_feedback_ibfk_4` FOREIGN KEY (`visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_schedule`
--
ALTER TABLE `tbl_schedule`
  ADD CONSTRAINT `tbl_schedule_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `tbl_student_levels` (`level_id`),
  ADD CONSTRAINT `tbl_schedule_ibfk_2` FOREIGN KEY (`schedule_item_id`) REFERENCES `tbl_schedule_items` (`schedule_item_id`);

--
-- Constraints for table `tbl_schedule_items`
--
ALTER TABLE `tbl_schedule_items`
  ADD CONSTRAINT `fk_routine2` FOREIGN KEY (`routine_id_2`) REFERENCES `tbl_routines` (`routine_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subject2` FOREIGN KEY (`subject_id_2`) REFERENCES `tbl_subjects` (`subject_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_schedule_items_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subjects` (`subject_id`),
  ADD CONSTRAINT `tbl_schedule_items_ibfk_2` FOREIGN KEY (`routine_id`) REFERENCES `tbl_routines` (`routine_id`);

--
-- Constraints for table `tbl_students`
--
ALTER TABLE `tbl_students`
  ADD CONSTRAINT `fk_parent_profile` FOREIGN KEY (`parent_profile_id`) REFERENCES `tbl_parents_profile` (`parent_profile_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_students_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `tbl_users` (`user_id`),
  ADD CONSTRAINT `tbl_students_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `tbl_student_levels` (`level_id`);

--
-- Constraints for table `tbl_student_assigned`
--
ALTER TABLE `tbl_student_assigned`
  ADD CONSTRAINT `tbl_student_assigned_ibfk_1` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`),
  ADD CONSTRAINT `tbl_student_assigned_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`);

--
-- Constraints for table `tbl_student_milestone_interpretation`
--
ALTER TABLE `tbl_student_milestone_interpretation`
  ADD CONSTRAINT `fk_milestone_progress` FOREIGN KEY (`overall_progress_id`) REFERENCES `tbl_overall_progress` (`overall_progress_id`),
  ADD CONSTRAINT `fk_milestone_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`);

--
-- Constraints for table `tbl_subject_overall_progress`
--
ALTER TABLE `tbl_subject_overall_progress`
  ADD CONSTRAINT `tbl_subject_overall_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `tbl_subject_overall_progress_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `tbl_subjects` (`subject_id`),
  ADD CONSTRAINT `tbl_subject_overall_progress_ibfk_3` FOREIGN KEY (`advisory_id`) REFERENCES `tbl_advisory` (`advisory_id`),
  ADD CONSTRAINT `tbl_subject_overall_progress_ibfk_4` FOREIGN KEY (`finalsubj_visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`);

--
-- Constraints for table `tbl_system_logs`
--
ALTER TABLE `tbl_system_logs`
  ADD CONSTRAINT `fk_target_student` FOREIGN KEY (`target_student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_target_user` FOREIGN KEY (`target_user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_tracking_adventurer`
--
ALTER TABLE `tbl_tracking_adventurer`
  ADD CONSTRAINT `fk_tracking_adventurer_activity` FOREIGN KEY (`activity_id`) REFERENCES `tbl_activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_adventurer_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_adventurer_visual_feedback` FOREIGN KEY (`visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_tracking_discoverer`
--
ALTER TABLE `tbl_tracking_discoverer`
  ADD CONSTRAINT `fk_tracking_discoverer_activity` FOREIGN KEY (`activity_id`) REFERENCES `tbl_activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_discoverer_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_discoverer_visual_feedback` FOREIGN KEY (`visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_tracking_explorer`
--
ALTER TABLE `tbl_tracking_explorer`
  ADD CONSTRAINT `fk_tracking_explorer_activity` FOREIGN KEY (`activity_id`) REFERENCES `tbl_activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_explorer_student` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_explorer_visual_feedback` FOREIGN KEY (`visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_tracking_explorer_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `tbl_students` (`student_id`),
  ADD CONSTRAINT `tbl_tracking_explorer_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `tbl_activities` (`activity_id`),
  ADD CONSTRAINT `tbl_tracking_explorer_ibfk_3` FOREIGN KEY (`visual_feedback_id`) REFERENCES `tbl_visual_feedback` (`visual_feedback_id`);

--
-- Constraints for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD CONSTRAINT `tbl_users_ibfk_1` FOREIGN KEY (`user_role`) REFERENCES `tbl_roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
