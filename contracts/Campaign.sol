// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

contract Campaign {
    address payable public receipient;
    uint256 public expiration_date;
    AggregatorV3Interface internal priceFeed;

    uint256 public goal;

    // error AuctionAlreadyEnded();

    event DonationSend(address donor, uint256 amount);
    event DonationEnded(address receipient, uint256 amount);

    constructor(
        uint256 duration,
        address payable receipient_adress,
        uint256 goal
    ) public {
        receipient = receipient_adress;
        goal = goal;
        priceFeed = AggregatorV3Interface(
            0x9326BFA02ADD2366b30bacB125260Af641031331
        );
        expiration_date = block.timestamp + duration;
    }

    function donate() public payable {
        if (expiration_date < block.timestamp)
            revert("This Donation Campaign has already ended.");
        emit DonationSend(msg.sender, msg.value);
    }

    function getLatestPrice() public view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }

    function getBalance() public view returns (uint256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        uint256 balance;
        balance = uint256(price) * address(this).balance;
        return balance;
    }

    function payout() public {
        if (getBalance() < goal)
            revert("Donation Campaign has not reached its end goal");
        if (block.timestamp < expiration_date)
            revert("Donation Campaign has not Ended Yet");
        emit DonationEnded(receipient, address(this).balance);
        receipient.transfer(address(this).balance);
    }
}