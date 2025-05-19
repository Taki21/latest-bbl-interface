export const COMMPUTATION_TASK_MANAGER_CONTRACT = "0xD364f518D0969233CE02D831f56684b25AA2c937";

export const COMMPUTATION_TASK_MANAGER_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_implementation",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint128",
				"name": "amount",
				"type": "uint128"
			}
		],
		"name": "allocateTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "taskId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint40",
				"name": "amount",
				"type": "uint40"
			}
		],
		"name": "completeTask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "uint8",
				"name": "newMemberReward",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "referralReward",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			}
		],
		"name": "createOrganization",
		"outputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "uint48",
				"name": "deadline",
				"type": "uint48"
			},
			{
				"internalType": "uint40",
				"name": "reward",
				"type": "uint40"
			},
			{
				"internalType": "uint8",
				"name": "mode",
				"type": "uint8"
			}
		],
		"name": "createTask",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "taskId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "implementation",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "referralId",
				"type": "bytes32"
			}
		],
		"name": "joinOrganization",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "taskId",
				"type": "uint256"
			},
			{
				"internalType": "uint48",
				"name": "deadline",
				"type": "uint48"
			},
			{
				"internalType": "uint40",
				"name": "reward",
				"type": "uint40"
			},
			{
				"internalType": "uint8",
				"name": "mode",
				"type": "uint8"
			}
		],
		"name": "modifyTask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "organizations",
		"outputs": [
			{
				"internalType": "address",
				"name": "admin",
				"type": "address"
			},
			{
				"internalType": "uint96",
				"name": "numMembers",
				"type": "uint96"
			},
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint72",
				"name": "currentTaskId",
				"type": "uint72"
			},
			{
				"internalType": "uint8",
				"name": "isInitialized",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "newMemberReward",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "referralReward",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "referrers",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "organizationId",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "taskId",
				"type": "uint256"
			},
			{
				"internalType": "uint40",
				"name": "amount",
				"type": "uint40"
			}
		],
		"name": "submitAutonomousTask",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "tasks",
		"outputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "uint48",
				"name": "deadline",
				"type": "uint48"
			},
			{
				"internalType": "uint40",
				"name": "balance",
				"type": "uint40"
			},
			{
				"internalType": "uint8",
				"name": "mode",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userTaskRecord",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "usersDetails",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "allocation",
				"type": "uint128"
			},
			{
				"internalType": "uint64",
				"name": "role",
				"type": "uint64"
			},
			{
				"internalType": "uint64",
				"name": "isMember",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]