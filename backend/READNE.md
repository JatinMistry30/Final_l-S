### Database


# user

```
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_general_ci;
```
#  Items

```
CREATE  TABLE `items` (
`id`  int(11) NOT NULL,
`userId`  int(11) NOT NULL,
`type` enum('lost','found') NOT NULL,
`itemName`  varchar(255) NOT NULL,
`description`  text  DEFAULT  NULL,
`category`  varchar(100) NOT NULL,
`location`  varchar(255) NOT NULL,
`date_reported`  datetime  NOT NULL,
`time_reported`  time  NOT NULL,
`photoPath`  varchar(255) DEFAULT  NULL,
`status` enum('active','resolved','pending_claim','claimed') DEFAULT  'active',
`created_at`  timestamp  NOT NULL  DEFAULT  current_timestamp(),
`updated_at`  timestamp  NOT NULL  DEFAULT  current_timestamp() ON  UPDATE  current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

# Found_reports

```
CREATE  TABLE `found_reports` (
`id`  int(11) NOT NULL,
`item_id`  int(11) NOT NULL,
`location`  varchar(255) NOT NULL,
`description`  text  NOT NULL,
`photo_path`  varchar(255) NOT NULL,
`finder_id`  int(11) NOT NULL,
`finder_mobile`  varchar(15) NOT NULL,
`finder_email`  varchar(255) NOT NULL,
`created_at`  timestamp  NOT NULL  DEFAULT  current_timestamp(),
`item_owner_id`  int(11) NOT NULL,
`item_owner_username`  varchar(100) NOT NULL,
`item_owner_email`  varchar(100) NOT NULL,
`status`  varchar(20) DEFAULT  'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

# claim-reports

```
CREATE  TABLE `claim_reports` (
`id`  int(11) NOT NULL,
`item_id`  int(11) NOT NULL,
`location`  varchar(255) NOT NULL,
`description`  text  NOT NULL,
`photo_path`  varchar(255) NOT NULL,
`finder_id`  int(11) NOT NULL,
`finder_mobile`  varchar(15) NOT NULL,
`finder_email`  varchar(255) NOT NULL,
`created_at`  timestamp  NOT NULL  DEFAULT  current_timestamp(),
`item_owner_id`  int(11) NOT NULL,
`item_owner_username`  varchar(100) NOT NULL,
`item_owner_email`  varchar(100) NOT NULL,
`status`  varchar(20) DEFAULT  'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
