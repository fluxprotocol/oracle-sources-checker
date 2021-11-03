# Oracle sources checker

Allows for checking sources to make sure given sources are deterministic and will not cause invalid outcomes.

## Installation

`npm install`

## Getting started

First run the server by using `npm start`

## Adding a request to the pool

Make a `POST` request (using Curl, Postman, whatever you prefer) to `http://localhost:1445/requests` using the following params:

|Param|Type|Default|Description|
|---|---|---|---|
|dataType|RequestDataType|n/a|The data type of the request, more on this below|
|sources|RequestSource[]|n/a|An array of sources containing detail about where to find the data, more on this below|
|interval|number|14000|How much time between each execution (in ms)|
|executeTime|number|640000000|How long the request should be in the pool to be executed, defaults to 1 day|

`RequestDataType`

|Param|Type|Default|Description|
|---|---|---|---|
|type|"string" or "number"|n/a|Whether the outcome should be a string or number. For strings only 1 source can be provided. For numbers multiple sources is possible. They will be added together and divided by the amount of succesful fetches.|
|multiplier|number|n/a|Required when using the "number" type. The result number will get multiplied by this amount in order for numbers to include decimals without using floats. For example 10000 will have 4 decimals encoded in a int.|

`RequestSource`

|Param|Type|Default|Description|
|---|---|---|---|
|end_point|string|n/a|The API endpoint the node has to fetch data from
|source_path|string|n/a|The path to find the value inside the JSON document. See https://github.com/besok/jsonpath-rust for examples.


String example:

```JSON
{
    "sources": [
        {
            "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
            "source_path": "abilities[$$last].ability.name"
        }
    ],
    "dataType": {
        "type": "string"
    },
    "interval": 25000,
    "executeTime": 640000000
}
```

Number example:

```JSON
{
    "sources": [
        {
            "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
            "source_path": "base_experience"
        },
        {
            "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
            "source_path": "weight"
        }
    ],
    "dataType": {
        "type": "number",
        "multiplier": 10000
    },
    "interval": 25000,
    "executeTime": 640000000
}
```

### Response

Response will look something like this, make sure that you save the id in order to fetch the report later (or look inside the `reports/` folder).

```JSON
{
    "dataType": {
        "type": "number",
        "multiplier": 10000
    },
    "sources": [
        {
            "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
            "source_path": "base_experience"
        },
        {
            "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
            "source_path": "weight"
        }
    ],
    "id": "0xb81d16216d41af51e0482680553ce4bf7fb019da1371e790cfef4d9d6e862e31",
    "interval": 25000,
    "executeTime": 640000000
}
```

## Viewing a request report

You can view a report while the request is still ongoing, this way you can now early if a request is invalid.

### Request is non-deterministic

* When `gasReports` contains more than 1 item.
* When `outcomes` contains more than 1 item.

### Request could be burning bonds of requestor

* When invalids is higher than 0

Make a `GET` to `http://localhost:1445/requests/ID_HERE` where `ID_HERE` is the request id (for example: `http://localhost:1445/requests/0xb81d16216d41af51e0482680553ce4bf7fb019da1371e790cfef4d9d6e862e31`)
Which will give you something like the following:

```JSON
{
    "data": {
        "active": true,
        "lastExecuted": 1635931759736,
        "report": {
            "errorLogs": [],
            "executes": 18,
            "gasReports": [
                "633401292"
            ],
            "invalids": 0,
            "valids": 18,
            "outcomes": [
                "705000"
            ]
        },
        "request": {
            "dataType": {
                "type": "number",
                "multiplier": 10000
            },
            "sources": [
                {
                    "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
                    "source_path": "base_experience"
                },
                {
                    "end_point": "https://pokeapi.co/api/v2/pokemon/ditto",
                    "source_path": "weight"
                }
            ],
            "id": "0xb81d16216d41af51e0482680553ce4bf7fb019da1371e790cfef4d9d6e862e31",
            "interval": 25000,
            "executeTime": 640000000
        },
        "stopExecutingAt": 1636571248583
    }
}
```

|Param|Type|Description|
|---|---|---|
|active|boolean|Whether or not the request is still in the execution pool|
|lastExecuted|number|Timestamp of when the request was last executed|
|stopExecutingAt|number|Timestamp for when the request needs to stop being executed|
|report|RequestReport|Report of the request. More info below.

|Param|Type|Description|
|---|---|---|
|errorLogs|string[][]|Logs of the VM when the request was deemed invalid|
|executes|number|Amount of times the request has been executed|
|gasReports|string|The amount of gas used for the request, if there are multiple entries it should be a flag for the request not being deterministic|
|invalids|number|Amount of invalid requests|
|valids|number|Amount of valid requests|
|outcomes|string[]|The outcomes received by the VM, should only contain 1 item. The request is non deterministic if it contains more.|


## Stop a request early

If a report quickly shows that the request is non-deterministic and/or invalid, you can close it early.

Make a `DELETE` request to `http://localhost:1445/requests/ID_HERE` where `ID_HERE` is the request id (for example: ``http://localhost:1445/requests/0xb81d16216d41af51e0482680553ce4bf7fb019da1371e790cfef4d9d6e862e31``)