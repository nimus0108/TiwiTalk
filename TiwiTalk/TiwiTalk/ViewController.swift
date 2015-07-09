//
//  ViewController.swift
//  TiwiTalk
    //  Created by Su Min on 7/8/15.
//  Copyright (c) 2015 Su Min. All rights reserved.
//

import UIKit

class ViewController: JSQMessagesViewController {
    
    var messages = [JSQMessage]()
    
    lazy var bubbleFactory: JSQMessagesBubbleImageFactory = {
        return JSQMessagesBubbleImageFactory()
        }()
    
    private lazy var avatarImageBlank: JSQMessagesAvatarImage = {
        return JSQMessagesAvatarImageFactory.avatarImageWithImage(UIImage(named: "chat_blank"), diameter: 30);
        }();
    
    private let outgoingColor = UIColor(red: 0.35, green: 0.8, blue: 0.97, alpha: 1.0)
    private let incomingColor = UIColor(red: 0.93, green:0.93, blue:0.94, alpha:1)
    
    private lazy var bubbleImageOutgoing: JSQMessagesBubbleImage = {
        return self.bubbleFactory.outgoingMessagesBubbleImageWithColor(self.outgoingColor)
        }()
    private lazy var bubbleImageIncoming: JSQMessagesBubbleImage = {
        return self.bubbleFactory.incomingMessagesBubbleImageWithColor(self.incomingColor)
        }()
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
        senderDisplayName = "Su Min"
        senderId = "nimus0108"
        
        collectionView.collectionViewLayout.outgoingAvatarViewSize = CGSizeZero
        collectionView.collectionViewLayout.incomingAvatarViewSize = CGSizeZero
        
        loadFakeMessages()
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    override func didPressSendButton(button: UIButton!, withMessageText text: String!, senderId: String!, senderDisplayName: String!, date: NSDate!) {
        print("Send")
        
        let message = JSQMessage(senderId: senderId, senderDisplayName: senderDisplayName, date: date, text: text)
        messages.append(message)
        
        finishSendingMessage()
        
    }
    
    override func didPressAccessoryButton(sender: UIButton!) {
        print("Attach picture")
    }
    
    private func outgoing(message:JSQMessage) -> Bool {
        return message.senderId == self.senderId
    }
    
    
    override func collectionView(collectionView: JSQMessagesCollectionView!, messageBubbleImageDataForItemAtIndexPath indexPath: NSIndexPath!) -> JSQMessageBubbleImageDataSource! {
        if outgoing(messages[indexPath.item]) {
            return bubbleImageOutgoing
        } else {
            return bubbleImageIncoming
        }
    }
    
    override func collectionView(collectionView: JSQMessagesCollectionView!, messageDataForItemAtIndexPath indexPath: NSIndexPath!) -> JSQMessageData! {
        return messages[indexPath.row]
    }
    
    override func collectionView(collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return messages.count
    }
    
    override func collectionView(collectionView: JSQMessagesCollectionView!, avatarImageDataForItemAtIndexPath indexPath: NSIndexPath!) -> JSQMessageAvatarImageDataSource! {
        return nil
    }
    
    override func collectionView(collectionView: UICollectionView, cellForItemAtIndexPath indexPath: NSIndexPath) -> UICollectionViewCell {
        let cell = super.collectionView(collectionView, cellForItemAtIndexPath: indexPath) as! JSQMessagesCollectionViewCell
        
        let msg = messages[indexPath.row]
        
        if !msg.isMediaMessage {
            if msg.senderId != self.senderId {
                cell.textView.textColor = UIColor.blackColor()
            }
            else {
                cell.textView.textColor = UIColor.whiteColor()
            }
            
            let attributes : [NSObject:AnyObject] = [NSForegroundColorAttributeName:cell.textView.textColor, NSUnderlineStyleAttributeName: 1]
            
            cell.textView.linkTextAttributes = attributes
        }
        
        return cell
    }
    
    private func loadFakeMessages() {
        messages = [
            JSQMessage(senderId: "nimus0108", senderDisplayName: "Su Min", date: NSDate.distantPast() as! NSDate, text: "Hey there"),
            JSQMessage(senderId: "kira", senderDisplayName: "Kira", date: NSDate.distantPast() as! NSDate, text: "Jay Sucks")
        ]
    }
    
}
