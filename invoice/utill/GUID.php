<?php


$view = "";
if (isset ( $_GET ["view"] ))
	$view = $_GET ["view"];

switch ($view) {

	// GET
	case "getGUID" :

      mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
			$charid = strtoupper(md5(uniqid(rand(), true)));
			$hyphen = chr(45);// "-"
			// $uuid = chr(123)// "{"
			$uuid =
			substr($charid, 0, 8).$hyphen
			.substr($charid, 8, 4).$hyphen
			.substr($charid,12, 4).$hyphen
			.substr($charid,16, 4).$hyphen
			.substr($charid,20,12);
			// .chr(125);// "}"
			echo $uuid;

  break;


	case "" :
		header ( 'HTTP/1.1 404 Not Found' );
		break;
}

?>
